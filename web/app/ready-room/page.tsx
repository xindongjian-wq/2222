'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Match {
  id: string;
  theme: string;
  status: 'upcoming' | 'registration' | 'competing' | 'judging' | 'finished';
  startTime: string;
  endTime?: string;
  teams: string[];
  createdAt: string;
}

interface Team {
  id: string;
  name: string;
  leaderId: string;
  members: string[];
  postId?: string;
  status: 'forming' | 'registered' | 'competing' | 'finished';
}

export default function ReadyRoomPage() {
  const router = useRouter();
  const [matches, setMatches] = useState<Match[]>([]);
  const [myTeams, setMyTeams] = useState<Team[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [showCreateTeam, setShowCreateTeam] = useState(false);
  const [showCreateMatch, setShowCreateMatch] = useState(false);
  const [loading, setLoading] = useState(true);
  const [newTeamName, setNewTeamName] = useState('');
  const [newMatchTheme, setNewMatchTheme] = useState('');
  const [newMatchTime, setNewMatchTime] = useState('');

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
        const matchesData = await matchesRes.json();
        if (matchesData.code === 0) {
          setMatches(matchesData.data);
        }
      }

      if (teamsRes.ok) {
        const teamsData = await teamsRes.json();
        if (teamsData.code === 0) {
          setMyTeams(teamsData.data);
        }
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamName.trim()) return;

    try {
      const res = await fetch('/api/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newTeamName }),
      });

      const data = await res.json();
      if (data.code === 0) {
        setNewTeamName('');
        setShowCreateTeam(false);
        fetchData();
      }
    } catch (error) {
      console.error('Failed to create team:', error);
    }
  };

  const handleCreateMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMatchTheme.trim() || !newMatchTime) return;

    try {
      const res = await fetch('/api/matches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          theme: newMatchTheme,
          startTime: newMatchTime,
        }),
      });

      const data = await res.json();
      if (data.code === 0) {
        setNewMatchTheme('');
        setNewMatchTime('');
        setShowCreateMatch(false);
        fetchData();
      }
    } catch (error) {
      console.error('Failed to create match:', error);
    }
  };

  const handleRegister = async () => {
    if (!selectedMatch || !selectedTeam) return;

    try {
      const res = await fetch(`/api/matches/${selectedMatch.id}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamId: selectedTeam.id }),
      });

      const data = await res.json();
      if (data.code === 0) {
        setSelectedMatch(null);
        setSelectedTeam(null);
        fetchData();
      } else {
        alert(data.error || '报名失败');
      }
    } catch (error) {
      console.error('Failed to register:', error);
      alert('报名失败');
    }
  };

  const getStatusBadge = (status: Match['status']) => {
    const badges = {
      upcoming: { text: '即将开始', class: 'bg-gray-100 text-gray-600' },
      registration: { text: '报名中', class: 'bg-green-100 text-green-600' },
      competing: { text: '进行中', class: 'bg-red-100 text-red-600' },
      judging: { text: '评审中', class: 'bg-amber-100 text-amber-600' },
      finished: { text: '已结束', class: 'bg-gray-100 text-gray-400' },
    };
    const badge = badges[status];
    return <span className={`px-3 py-1 rounded-full text-sm font-medium ${badge.class}`}>{badge.text}</span>;
  };

  const isTeamRegistered = (match: Match, teamId: string) => {
    return match.teams.includes(teamId);
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
          <h1 className="text-xl font-bold text-gray-800">备战室</h1>
          <div className="w-16"></div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* 操作栏 */}
        <div className="flex justify-between items-center mb-6">
          <p className="text-gray-500">查看比赛并报名参赛</p>
          <div className="flex gap-3">
            <button
              onClick={() => setShowCreateTeam(!showCreateTeam)}
              className="btn-secondary"
            >
              {showCreateTeam ? '取消' : '创建队伍'}
            </button>
            <button
              onClick={() => setShowCreateMatch(!showCreateMatch)}
              className="btn-primary"
            >
              {showCreateMatch ? '取消' : '创建比赛'}
            </button>
          </div>
        </div>

        {/* 创建队伍表单 */}
        {showCreateTeam && (
          <div className="card mb-6">
            <form onSubmit={handleCreateTeam} className="flex gap-4">
              <input
                type="text"
                placeholder="队伍名称"
                value={newTeamName}
                onChange={(e) => setNewTeamName(e.target.value)}
                className="flex-1 px-4 py-2 rounded-xl border border-amber-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-100 outline-none"
                required
              />
              <button type="submit" className="btn-primary">
                创建
              </button>
            </form>
          </div>
        )}

        {/* 创建比赛表单 */}
        {showCreateMatch && (
          <div className="card mb-6">
            <form onSubmit={handleCreateMatch} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  比赛主题
                </label>
                <input
                  type="text"
                  placeholder="例如：环保主题 AI 应用开发"
                  value={newMatchTheme}
                  onChange={(e) => setNewMatchTheme(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl border border-amber-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-100 outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  开始时间
                </label>
                <input
                  type="datetime-local"
                  value={newMatchTime}
                  onChange={(e) => setNewMatchTime(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl border border-amber-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-100 outline-none"
                  required
                />
              </div>
              <button type="submit" className="btn-primary w-full">
                发布比赛
              </button>
            </form>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          {/* 比赛列表 */}
          <div>
            <h2 className="text-lg font-bold text-gray-800 mb-4">比赛列表</h2>
            <div className="space-y-4">
              {matches.length === 0 ? (
                <div className="card text-center py-8">
                  <div className="text-4xl mb-2">🏆</div>
                  <p className="text-gray-500">暂无比赛</p>
                </div>
              ) : (
                matches.map((match) => (
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
                      {getStatusBadge(match.status)}
                    </div>
                    <p className="text-sm text-gray-500 mb-2">
                      开始时间：{new Date(match.startTime).toLocaleString('zh-CN')}
                    </p>
                    <p className="text-sm text-gray-500">
                      已报名：{match.teams.length} 支队伍
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* 我的队伍 */}
          <div>
            <h2 className="text-lg font-bold text-gray-800 mb-4">我的队伍</h2>
            <div className="space-y-4">
              {myTeams.length === 0 ? (
                <div className="card text-center py-8">
                  <div className="text-4xl mb-2">👥</div>
                  <p className="text-gray-500">还没有队伍，去创建一个吧！</p>
                </div>
              ) : (
                myTeams.map((team) => (
                  <div
                    key={team.id}
                    onClick={() => setSelectedTeam(team)}
                    className={`card cursor-pointer transition-all ${
                      selectedTeam?.id === team.id
                        ? 'ring-2 ring-amber-400'
                        : 'hover:shadow-md'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-gray-800">{team.name}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        team.status === 'forming'
                          ? 'bg-blue-100 text-blue-600'
                          : team.status === 'registered'
                          ? 'bg-green-100 text-green-600'
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {team.status === 'forming' ? '组队中' : team.status === 'registered' ? '已报名' : '已完成'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">
                      成员：{team.members.length} 人
                    </p>
                  </div>
                ))
              )}
            </div>

            {/* 报名操作 */}
            {selectedMatch && selectedTeam && (
              <div className="card mt-6 bg-gradient-to-r from-amber-50 to-orange-50">
                <h3 className="font-semibold text-gray-800 mb-2">确认报名</h3>
                <p className="text-sm text-gray-600 mb-4">
                  用 <span className="font-medium text-amber-600">{selectedTeam.name}</span> 报名参加{' '}
                  <span className="font-medium text-amber-600">{selectedMatch.theme}</span>
                </p>
                {isTeamRegistered(selectedMatch, selectedTeam.id) ? (
                  <p className="text-amber-600 font-medium">已报名 ✓</p>
                ) : selectedMatch.status !== 'upcoming' && selectedMatch.status !== 'registration' ? (
                  <p className="text-gray-500">比赛不在报名阶段</p>
                ) : (
                  <button onClick={handleRegister} className="btn-primary w-full">
                    确认报名
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
