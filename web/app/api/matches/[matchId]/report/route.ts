import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/lib/storage-kv';

// 生成战报
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ matchId: string }> }
) {
  try {
    const { matchId } = await params;

    const match = await storage.findMatchById(matchId);
    if (!match) {
      return NextResponse.json({ code: -1, error: '比赛不存在' }, { status: 404 });
    }

    // 获取所有队伍的评分
    const teamRankings: {
      teamId: string;
      avgScore: number;
    }[] = [];

    for (const teamId of match.teams) {
      const avgScore = await storage.getTeamAverageScore(matchId, teamId);
      teamRankings.push({ teamId, avgScore });
    }

    // 按分数排序
    teamRankings.sort((a, b) => b.avgScore - a.avgScore);

    // 获取所有评分用于生成亮点
    const allScores = await storage.getScoresByMatch(matchId);

    // 提取评委评论
    const judgeComments = allScores
      .filter(s => s.comment && s.comment.trim().length > 0)
      .map(s => `${s.judgeName}: ${s.comment}`);

    // 生成亮点
    const highlights: string[] = [];
    if (teamRankings.length > 0) {
      const topScore = teamRankings[0].avgScore;
      highlights.push(`最高分: ${topScore} 分`);
    }
    highlights.push(`${match.teams.length} 支队伍参赛`);
    highlights.push(`${allScores.length} 份评分提交`);

    // 构建战报
    const report = {
      summary: `${match.theme} - ${teamRankings.length} 支队伍经过激烈角逐，最终产生排名。`,
      highlights,
      judgeComments,
    };

    // 更新比赛结果
    const rankings = teamRankings.map((tr, index) => ({
      teamId: tr.teamId,
      rank: index + 1,
      score: tr.avgScore,
      feedback: '',
    }));

    await storage.updateMatch(matchId, {
      status: 'finished',
      rankings,
      report,
      endTime: new Date().toISOString(),
    });

    return NextResponse.json({
      code: 0,
      data: { ...match, rankings, report },
    });
  } catch (error) {
    console.error('Generate report error:', error);
    return NextResponse.json({ code: -1, error: 'Internal server error' }, { status: 500 });
  }
}

// 获取战报
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ matchId: string }> }
) {
  try {
    const { matchId } = await params;
    const match = await storage.findMatchById(matchId);

    if (!match) {
      return NextResponse.json({ code: -1, error: '比赛不存在' }, { status: 404 });
    }

    return NextResponse.json({
      code: 0,
      data: match,
    });
  } catch (error) {
    console.error('Get report error:', error);
    return NextResponse.json({ code: -1, error: 'Internal server error' }, { status: 500 });
  }
}
