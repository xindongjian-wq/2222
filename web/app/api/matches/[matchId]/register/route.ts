import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/lib/storage';
import { cookies } from 'next/headers';

// 报名参加比赛
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ matchId: string }> }
) {
  const cookieStore = await cookies();
  const userId = cookieStore.get('user_id')?.value;

  if (!userId) {
    return NextResponse.json({ code: -1, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { matchId } = await params;
    const body = await request.json();
    const { teamId } = body;

    if (!teamId) {
      return NextResponse.json({ code: -1, error: '队伍ID必填' }, { status: 400 });
    }

    // 获取比赛信息
    const match = await storage.findMatchById(matchId);
    if (!match) {
      return NextResponse.json({ code: -1, error: '比赛不存在' }, { status: 404 });
    }

    // 检查比赛状态
    if (match.status !== 'upcoming' && match.status !== 'registration') {
      return NextResponse.json({ code: -1, error: '比赛不在报名阶段' }, { status: 400 });
    }

    // 检查是否已报名
    if (match.teams.includes(teamId)) {
      return NextResponse.json({ code: -1, error: '队伍已报名' }, { status: 400 });
    }

    // 获取队伍信息
    const team = await storage.findTeamById(teamId);
    if (!team) {
      return NextResponse.json({ code: -1, error: '队伍不存在' }, { status: 404 });
    }

    // 添加队伍到比赛
    const updatedMatch = await storage.addTeamToMatch(matchId, teamId);

    // 更新队伍状态
    await storage.updateTeam(teamId, {
      status: 'registered',
      matchId: matchId,
    });

    return NextResponse.json({
      code: 0,
      data: updatedMatch,
    });
  } catch (error) {
    console.error('Register match error:', error);
    return NextResponse.json({ code: -1, error: 'Internal server error' }, { status: 500 });
  }
}
