'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Match {
  id: string;
  theme: string;
  status: string;
  startTime: string;
  teams: string[];
}

interface Team {
  id: string;
  name: string;
  members: string[];
}

interface Score {
  id: string;
  matchId: string;
  teamId: string;
  judgeId: string;
  judgeName: string;
  criteria: {
    creativity: number;
    technical: number;
    completeness: number;
    presentation: number;
  };
  totalScore: number;
  comment: string;
  createdAt: string;
}

interface ScoreData {
  scores: Score[];
  avgScore: number;
}

export default function JudgePage() {
  const router = useRouter();
  const [matches, setMatches] = useState<Match[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [scoreData, setScoreData] = useState<ScoreData | null>(null);
  const [loading, setLoading] = useState(true);

  // 评分表单
  const [criteria, setCriteria] = useState({
    creativity: 7,
    technical: 7,
    completeness: 7,
    presentation: 7,
  });
  const [comment, setComment] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [matchesRes, teamsRes] = await Promise.all([
        fetch('/api/matches'),
        fetch('/api/teams'),
      ]);

      if (matchesRes.ok) {
        const data = await matchesRes.json();
        if (data.code === 0) {
          // 只显示进行中或评审中的比赛
          const activeMatches = data.data.filter((m: Match) =>
            m.status === 'competing' || m.status === 'judging'
          );
          setMatches(activeMatches);
          if (activeMatches.length > 0) {
            setSelectedMatch(activeMatches[0]);
          }
        }
      }

      if (teamsRes.ok) {
        const data = await teamsRes.json();
        if (data.code === 0) {
          setTeams(data.data);
        }
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedMatch && selectedTeam) {
      loadScores(selectedMatch.id, selectedTeam.id);
    }
  }, [selectedMatch, selectedTeam]);

  const loadScores = async (matchId: string, teamId: string) => {
    try {
      const res = await fetch(`/api/scores?matchId=${matchId}&teamId=${teamId}`);
      const data = await res.json();
      if (data.code === 0) {
        setScoreData(data.data);
      }
    } catch (error) {
      console.error('Failed to load scores:', error);
    }
  };

  const handleSubmitScore = async () => {
    if (!selectedMatch || !selectedTeam) return;

    try {
      const res = await fetch('/api/scores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          matchId: selectedMatch.id,
          teamId: selectedTeam.id,
          criteria,
          comment,
        }),
      });

      const data = await res.json();
      if (data.code === 0) {
        loadScores(selectedMatch.id, selectedTeam.id);
      }
    } catch (error) {
      console.error('Failed to submit score:', error);
    }
  };

  const totalScore = criteria.creativity + criteria.technical + criteria.completeness + criteria.presentation;

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
          <h1 className="text-xl font-bold text-gray-800">评审室</h1>
          <div className="w-16"></div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {matches.length === 0 ? (
          <div className="card text-center py-12">
            <div className="text-4xl mb-2">📋</div>
            <p className="text-gray-500">暂无正在评审的比赛</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-6">
            {/* 左侧：比赛和队伍选择 */}
            <div className="space-y-4">
              <div className="card">
                <h2 className="text-lg font-bold text-gray-800 mb-3">选择比赛</h2>
                <div className="space-y-2">
                  {matches.map((match) => (
                    <button
                      key={match.id}
                      onClick={() => setSelectedMatch(match)}
                      className={`w-full text-left p-3 rounded-xl transition-colors ${
                        selectedMatch?.id === match.id
                          ? 'bg-amber-500 text-white'
                          : 'bg-amber-50 text-gray-700 hover:bg-amber-100'
                      }`}
                    >
                      <div className="font-medium">{match.theme}</div>
                      <div className={`text-xs ${selectedMatch?.id === match.id ? 'text-amber-100' : 'text-gray-500'}`}>
                        {match.teams.length} 支队伍
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {selectedMatch && (
                <div className="card">
                  <h2 className="text-lg font-bold text-gray-800 mb-3">选择队伍</h2>
                  <div className="space-y-2">
                    {selectedMatch.teams.length === 0 ? (
                      <p className="text-sm text-gray-500">暂无队伍</p>
                    ) : (
                      teams
                        .filter(t => selectedMatch.teams.includes(t.id))
                        .map((team) => (
                          <button
                            key={team.id}
                            onClick={() => setSelectedTeam(team)}
                            className={`w-full text-left p-3 rounded-xl transition-colors ${
                              selectedTeam?.id === team.id
                                ? 'bg-amber-500 text-white'
                                : 'bg-amber-50 text-gray-700 hover:bg-amber-100'
                            }`}
                          >
                            <div className="font-medium">{team.name}</div>
                            <div className={`text-xs ${selectedTeam?.id === team.id ? 'text-amber-100' : 'text-gray-500'}`}>
                              {team.members.length} 人
                            </div>
                          </button>
                        ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* 右侧：评分区域 */}
            <div className="md:col-span-2">
              {selectedTeam && selectedMatch ? (
                <div className="card">
                  <h2 className="text-xl font-bold text-gray-800 mb-4">评分：{selectedTeam.name}</h2>

                  {/* 当前评分统计 */}
                  {scoreData && scoreData.avgScore > 0 && (
                    <div className="bg-gradient-to-r from-amber-100 to-orange-100 rounded-2xl p-4 mb-6">
                      <div className="text-center">
                        <div className="text-sm text-gray-600 mb-1">当前平均分</div>
                        <div className="text-4xl font-bold text-amber-600">{scoreData.avgScore}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          {scoreData.scores.length} 位评委已评分
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 评分标准 */}
                  <div className="space-y-4 mb-6">
                    <div>
                      <div className="flex justify-between mb-2">
                        <label className="font-medium text-gray-700">创意性</label>
                        <span className="text-amber-600 font-bold">{criteria.creativity}/10</span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="10"
                        value={criteria.creativity}
                        onChange={(e) => setCriteria({ ...criteria, creativity: parseInt(e.target.value) })}
                        className="w-full accent-amber-500"
                      />
                      <div className="flex justify-between text-xs text-gray-400">
                        <span>常规</span>
                        <span>创新</span>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between mb-2">
                        <label className="font-medium text-gray-700">技术性</label>
                        <span className="text-amber-600 font-bold">{criteria.technical}/10</span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="10"
                        value={criteria.technical}
                        onChange={(e) => setCriteria({ ...criteria, technical: parseInt(e.target.value) })}
                        className="w-full accent-amber-500"
                      />
                      <div className="flex justify-between text-xs text-gray-400">
                        <span>简单</span>
                        <span>复杂</span>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between mb-2">
                        <label className="font-medium text-gray-700">完整性</label>
                        <span className="text-amber-600 font-bold">{criteria.completeness}/10</span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="10"
                        value={criteria.completeness}
                        onChange={(e) => setCriteria({ ...criteria, completeness: parseInt(e.target.value) })}
                        className="w-full accent-amber-500"
                      />
                      <div className="flex justify-between text-xs text-gray-400">
                        <span>原型</span>
                        <span>完整</span>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between mb-2">
                        <label className="font-medium text-gray-700">展示性</label>
                        <span className="text-amber-600 font-bold">{criteria.presentation}/10</span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="10"
                        value={criteria.presentation}
                        onChange={(e) => setCriteria({ ...criteria, presentation: parseInt(e.target.value) })}
                        className="w-full accent-amber-500"
                      />
                      <div className="flex justify-between text-xs text-gray-400">
                        <span>粗糙</span>
                        <span>精美</span>
                      </div>
                    </div>
                  </div>

                  {/* 评价 */}
                  <div className="mb-6">
                    <label className="block font-medium text-gray-700 mb-2">
                      评价（可选）
                    </label>
                    <textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="写下你的评价..."
                      rows={3}
                      className="w-full px-4 py-2 rounded-xl border border-amber-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-100 outline-none resize-none"
                    />
                  </div>

                  {/* 总分显示 */}
                  <div className="bg-gray-50 rounded-2xl p-4 mb-4 flex justify-between items-center">
                    <span className="font-medium text-gray-700">总分</span>
                    <span className="text-2xl font-bold text-amber-600">{totalScore}/40</span>
                  </div>

                  {/* 提交按钮 */}
                  <button
                    onClick={handleSubmitScore}
                    className="btn-primary w-full"
                  >
                    提交评分
                  </button>

                  {/* 评分历史 */}
                  {scoreData && scoreData.scores.length > 0 && (
                    <div className="mt-6 pt-6 border-t border-gray-200">
                      <h3 className="font-medium text-gray-700 mb-3">评分记录</h3>
                      <div className="space-y-2">
                        {scoreData.scores.map((score) => (
                          <div key={score.id} className="bg-gray-50 rounded-xl p-3">
                            <div className="flex justify-between mb-1">
                              <span className="font-medium">{score.judgeName}</span>
                              <span className="text-amber-600 font-bold">{score.totalScore}/40</span>
                            </div>
                            <div className="text-xs text-gray-500">
                              创意:{score.criteria.creativity} 技术:{score.criteria.technical}
                              完整:{score.criteria.completeness} 展示:{score.criteria.presentation}
                            </div>
                            {score.comment && (
                              <div className="text-sm text-gray-600 mt-1">&ldquo;{score.comment}&rdquo;</div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="card text-center py-12">
                  <div className="text-4xl mb-2">📊</div>
                  <p className="text-gray-500">请先选择比赛和队伍</p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
