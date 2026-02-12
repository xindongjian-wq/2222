'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Match {
  id: string;
  theme: string;
  status: string;
  startTime: string;
  endTime?: string;
  teams: string[];
  rankings?: {
    teamId: string;
    rank: number;
    score: number;
    feedback: string;
  }[];
  report?: {
    summary: string;
    highlights: string[];
    judgeComments: string[];
  };
}

interface Team {
  id: string;
  name: string;
}

export default function HistoryPage() {
  const router = useRouter();
  const [matches, setMatches] = useState<Match[]>([]);
  const [teams, setTeams] = useState<Record<string, Team>>({});
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await fetch('/api/matches');
      const data = await res.json();
      if (data.code === 0) {
        // 只显示已结束的比赛
        const finished = data.data.filter((m: Match) => m.status === 'finished');
        setMatches(finished);

        // 获取所有队伍信息
        const teamsRes = await fetch('/api/teams');
        const teamsData = await teamsRes.json();
        if (teamsData.code === 0) {
          const teamMap: Record<string, Team> = {};
          teamsData.data.forEach((t: Team) => {
            teamMap[t.id] = t;
          });
          setTeams(teamMap);
        }
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReport = async (matchId: string) => {
    try {
      const res = await fetch(`/api/matches/${matchId}/report`, {
        method: 'POST',
      });
      const data = await res.json();
      if (data.code === 0) {
        fetchData();
        setSelectedMatch(data.data);
      }
    } catch (error) {
      console.error('Failed to generate report:', error);
    }
  };

  const getMedalEmoji = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-amber-200 border-t-amber-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50">
      {/* 顶部导航 */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-amber-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            返回
          </button>
          <h1 className="text-xl font-bold text-gray-800">历史战报</h1>
          <div className="w-16"></div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {matches.length === 0 ? (
          <div className="card text-center py-12">
            <div className="text-4xl mb-2">📜</div>
            <p className="text-gray-500">暂无历史战报</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {/* 比赛列表 */}
            <div>
              <h2 className="text-lg font-bold text-gray-800 mb-4">已结束的比赛</h2>
              <div className="space-y-3">
                {matches.map((match) => (
                  <div
                    key={match.id}
                    onClick={() => setSelectedMatch(match)}
                    className={`card cursor-pointer transition-all ${
                      selectedMatch?.id === match.id
                        ? 'ring-2 ring-amber-400'
                        : 'hover:shadow-md'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-gray-800">{match.theme}</h3>
                      <span className="text-2xl">🏆</span>
                    </div>
                    <p className="text-sm text-gray-500">
                      {new Date(match.startTime).toLocaleDateString('zh-CN')}
                    </p>
                    <p className="text-sm text-gray-500">
                      {match.teams.length} 支队伍参赛
                    </p>
                    {!match.report && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleGenerateReport(match.id);
                        }}
                        className="mt-2 btn-primary text-sm py-1"
                      >
                        生成战报
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* 战报详情 */}
            <div>
              {selectedMatch ? (
                <div className="card">
                  <h2 className="text-xl font-bold text-gray-800 mb-4">{selectedMatch.theme}</h2>

                  {selectedMatch.report ? (
                    <div className="space-y-6">
                      {/* 摘要 */}
                      <div className="bg-gradient-to-r from-amber-100 to-orange-100 rounded-2xl p-4">
                        <h3 className="font-semibold text-gray-800 mb-2">比赛摘要</h3>
                        <p className="text-gray-700">{selectedMatch.report.summary}</p>
                      </div>

                      {/* 亮点 */}
                      {selectedMatch.report.highlights.length > 0 && (
                        <div>
                          <h3 className="font-semibold text-gray-800 mb-2">比赛亮点</h3>
                          <div className="space-y-2">
                            {selectedMatch.report.highlights.map((highlight, i) => (
                              <div key={i} className="flex items-center gap-2">
                                <span className="text-amber-500">✦</span>
                                <span className="text-gray-700">{highlight}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* 排名 */}
                      {selectedMatch.rankings && selectedMatch.rankings.length > 0 && (
                        <div>
                          <h3 className="font-semibold text-gray-800 mb-3">最终排名</h3>
                          <div className="space-y-2">
                            {selectedMatch.rankings.map((ranking) => {
                              const team = teams[ranking.teamId];
                              return (
                                <div
                                  key={ranking.teamId}
                                  className="flex items-center gap-3 bg-gray-50 rounded-xl p-3"
                                >
                                  <span className="text-2xl">{getMedalEmoji(ranking.rank)}</span>
                                  <div className="flex-1">
                                    <div className="font-medium">{team?.name || '未知队伍'}</div>
                                    <div className="text-sm text-gray-500">{ranking.score} 分</div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* 评委评论 */}
                      {selectedMatch.report.judgeComments.length > 0 && (
                        <div>
                          <h3 className="font-semibold text-gray-800 mb-3">评委点评</h3>
                          <div className="space-y-2">
                            {selectedMatch.report.judgeComments.map((comment, i) => (
                              <div key={i} className="bg-amber-50 rounded-xl p-3">
                                <p className="text-gray-700 text-sm">&ldquo;{comment}&rdquo;</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* 时间 */}
                      <div className="pt-4 border-t border-gray-200">
                        <div className="text-sm text-gray-500">
                          开始时间：{new Date(selectedMatch.startTime).toLocaleString('zh-CN')}
                        </div>
                        {selectedMatch.endTime && (
                          <div className="text-sm text-gray-500">
                            结束时间：{new Date(selectedMatch.endTime).toLocaleString('zh-CN')}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="text-4xl mb-2">📄</div>
                      <p className="text-gray-500 mb-4">战报尚未生成</p>
                      <button
                        onClick={() => handleGenerateReport(selectedMatch.id)}
                        className="btn-primary"
                      >
                        生成战报
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="card text-center py-12">
                  <div className="text-4xl mb-2">📋</div>
                  <p className="text-gray-500">选择一场比赛查看战报</p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
