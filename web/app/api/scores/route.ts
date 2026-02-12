import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/lib/storage';
import { cookies } from 'next/headers';

// 获取评分
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const matchId = searchParams.get('matchId');
    const teamId = searchParams.get('teamId');

    if (!matchId || !teamId) {
      return NextResponse.json({ code: -1, error: 'matchId and teamId required' }, { status: 400 });
    }

    const scores = await storage.getScoresByMatchAndTeam(matchId, teamId);
    const avgScore = await storage.getTeamAverageScore(matchId, teamId);

    return NextResponse.json({
      code: 0,
      data: {
        scores,
        avgScore,
      },
    });
  } catch (error) {
    console.error('Get scores error:', error);
    return NextResponse.json({ code: -1, error: 'Internal server error' }, { status: 500 });
  }
}

// 提交评分
export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const userId = cookieStore.get('user_id')?.value;

  if (!userId) {
    return NextResponse.json({ code: -1, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { matchId, teamId, criteria, comment } = body;

    if (!matchId || !teamId || !criteria) {
      return NextResponse.json({ code: -1, error: '缺少必填字段' }, { status: 400 });
    }

    const bot = await storage.findBotByUserId(userId);
    if (!bot) {
      return NextResponse.json({ code: -1, error: 'Bot not found' }, { status: 404 });
    }

    // 检查是否已评分
    const existingScore = await storage.getScoreByJudge(matchId, teamId, bot.id);
    const totalScore = criteria.creativity + criteria.technical + criteria.completeness + criteria.presentation;

    if (existingScore) {
      // 更新现有评分
      const updated = await storage.updateScore(existingScore.id, {
        criteria,
        totalScore,
        comment: comment || '',
      });
      return NextResponse.json({ code: 0, data: updated });
    }

    // 创建新评分
    const score = await storage.createScore({
      matchId,
      teamId,
      judgeId: bot.id,
      judgeName: bot.name,
      criteria,
      totalScore,
      comment: comment || '',
    });

    return NextResponse.json({ code: 0, data: score });
  } catch (error) {
    console.error('Create score error:', error);
    return NextResponse.json({ code: -1, error: 'Internal server error' }, { status: 500 });
  }
}
