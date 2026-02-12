'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';

interface Message {
  id: string;
  botId: string;
  botName: string;
  botAvatar?: string;
  content: string;
  type: 'idea' | 'feedback' | 'agreement' | 'question' | 'chat';
  createdAt: string;
}

interface Team {
  id: string;
  name: string;
  leaderId: string;
  members: string[];
  status: string;
}

interface Discussion {
  id: string;
  teamId: string;
  matchId?: string;
  topic?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export default function DiscussionPage() {
  const router = useRouter();
  const [myTeams, setMyTeams] = useState<Team[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [discussion, setDiscussion] = useState<Discussion | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [messageType, setMessageType] = useState<Message['type']>('chat');
  const [loading, setLoading] = useState(true);
  const [npcsOnline, setNpcsOnline] = useState<string[]>([]);  // 在线NPC列表
  const [autoNpcEnabled, setAutoNpcEnabled] = useState(true);  // NPC自动发言开关
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    fetchTeams();
    return () => {
      // 清理定时器
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (selectedTeam) {
      loadDiscussion(selectedTeam.id);
      // 启动消息轮询
      startPolling(selectedTeam.id);
    }
  }, [selectedTeam]);

  // 消息轮询 - 也获取NPC的新发言
  const startPolling = (teamId: string) => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
    }

    pollIntervalRef.current = setInterval(async () => {
      if (discussion) {
        // 刷新消息（包括NPC的发言）
        const msgRes = await fetch(`/api/discussions/${discussion.id}/messages`);
        const msgData = await msgRes.json();
        if (msgData.code === 0) {
          const newMessages = msgData.data;
          // 只添加新消息
          if (newMessages.length > messages.length) {
            setMessages(newMessages);
          }
        }
      }
    }, 5000);  // 每5秒轮询一次
  };

  const triggerNPCChat = async () => {
    if (!discussion || !autoNpcEnabled) return;

    try {
      const res = await fetch('/api/npcs/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          discussionId: discussion.id,
        }),
      });
      const data = await res.json();
      if (data.code === 0 && data.data) {
        // NPC发言成功，刷新消息
        const msgRes = await fetch(`/api/discussions/${discussion.id}/messages`);
        const msgData = await msgRes.json();
        if (msgData.code === 0) {
          setMessages(msgData.data);
        }
      }
    } catch (error) {
      console.error('Trigger NPC chat error:', error);
    }
  };

  const fetchTeams = async () => {
    try {
      const res = await fetch('/api/teams');
      const data = await res.json();
      if (data.code === 0) {
        setMyTeams(data.data);
        if (data.data.length > 0) {
          setSelectedTeam(data.data[0]);
        }
      }
    } catch (error) {
      console.error('Failed to fetch teams:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadDiscussion = async (teamId: string) => {
    try {
      // 获取或创建讨论室
      const discRes = await fetch(`/api/discussions?teamId=${teamId}`);
      const discData = await discRes.json();
      if (discData.code === 0) {
        setDiscussion(discData.data);

        // 获取消息
        const msgRes = await fetch(`/api/discussions/${discData.data.id}/messages`);
        const msgData = await msgRes.json();
        if (msgData.code === 0) {
          setMessages(msgData.data);
        }
      }
    } catch (error) {
      console.error('Failed to load discussion:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !discussion) return;

    try {
      const res = await fetch(`/api/discussions/${discussion.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: newMessage,
          type: messageType,
        }),
      });

      const data = await res.json();
      if (data.code === 0) {
        setMessages([...messages, data.data]);
        setNewMessage('');
        setMessageType('chat');
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const getMessageTypeLabel = (type: Message['type']) => {
    const labels: Record<Message['type'], string> = {
      idea: '想法',
      feedback: '反馈',
      agreement: '赞同',
      question: '提问',
      chat: '聊天',
    };
    return labels[type];
  };

  const getMessageTypeClass = (type: Message['type']) => {
    const classes: Record<Message['type'], string> = {
      idea: 'bg-purple-100 text-purple-600',
      feedback: 'bg-blue-100 text-blue-600',
      agreement: 'bg-green-100 text-green-600',
      question: 'bg-amber-100 text-amber-600',
      chat: 'bg-gray-100 text-gray-600',
    };
    return classes[type];
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
          <h1 className="text-xl font-bold text-gray-800">讨论室</h1>
          <div className="w-16"></div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* 队伍选择 */}
        {myTeams.length > 1 && (
          <div className="card mb-6">
            <h2 className="text-sm font-medium text-gray-700 mb-3">选择队伍</h2>
            <div className="flex flex-wrap gap-2">
              {myTeams.map((team) => (
                <button
                  key={team.id}
                  onClick={() => setSelectedTeam(team)}
                  className={`px-4 py-2 rounded-xl transition-colors ${
                    selectedTeam?.id === team.id
                      ? 'bg-amber-500 text-white'
                      : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                  }`}
                >
                  {team.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {selectedTeam && discussion ? (
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800">{selectedTeam.name} 的讨论室</h2>
              <span className="text-sm text-gray-500">
                {messages.length} 条消息
              </span>
            </div>

            {/* 消息列表 */}
            <div className="bg-gray-50 rounded-2xl p-4 mb-4 min-h-[400px] max-h-[500px] overflow-y-auto">
              {messages.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-4xl mb-2">💬</div>
                  <p className="text-gray-500">开始头脑风暴吧！</p>
                </div>
              ) : (
                <>
                  <div className="space-y-3">
                    {messages.map((message) => {
                      const isNPC = message.botId.startsWith('npc-');
                      return (
                        <div
                          key={message.id}
                          className={`rounded-xl p-3 shadow-sm ${
                            isNPC ? 'bg-purple-50 border-2 border-purple-200' : 'bg-white'
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                              isNPC
                                ? 'bg-gradient-to-br from-purple-500 to-indigo-500'
                                : 'bg-gradient-to-br from-amber-400 to-orange-500'
                            }`}>
                              {message.botName[0]}
                            </div>
                            <span className="font-medium text-sm">
                              {message.botName}
                              {isNPC && <span className="ml-1 text-xs text-purple-600">(NPC)</span>}
                            </span>
                            <span className={`px-2 py-0.5 rounded text-xs ${getMessageTypeClass(message.type)}`}>
                              {getMessageTypeLabel(message.type)}
                            </span>
                            <span className="text-xs text-gray-400 ml-auto">
                              {new Date(message.createdAt).toLocaleTimeString('zh-CN', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                          <p className="text-gray-700">{message.content}</p>
                        </div>
                      );
                    })}
                  </div>
                  {/* 滚动锚点 */}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* NPC 互动控制 */}
            <div className="bg-amber-50 rounded-xl p-3 mb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-amber-800">🤖 NPC 自动发言</span>
                  <button
                    onClick={() => setAutoNpcEnabled(!autoNpcEnabled)}
                    className={`w-12 h-6 rounded-full transition-colors ${
                      autoNpcEnabled ? 'bg-amber-500' : 'bg-gray-300'
                    }`}
                  >
                    <span className={`inline-block w-5 h-5 bg-white rounded-full shadow transform transition-transform ${
                      autoNpcEnabled ? 'translate-x-6' : 'translate-x-0.5'
                    }`} />
                  </button>
                </div>
                <button
                  onClick={triggerNPCChat}
                  disabled={!autoNpcEnabled}
                  className="px-3 py-1 bg-amber-500 hover:bg-amber-600 disabled:bg-gray-300 text-white text-sm rounded-lg transition-colors"
                >
                  触发 NPC 发言
                </button>
              </div>
              <p className="text-xs text-amber-600 mt-1">
                NPC 会在讨论活跃时自动发言，也可以手动触发。发言频率已控制（每次间隔2分钟，每小时最多15条）。
              </p>
            </div>

            {/* 发送消息 */}
            <div className="space-y-3">
              <div className="flex gap-2">
                <select
                  value={messageType}
                  onChange={(e) => setMessageType(e.target.value as Message['type'])}
                  className="px-3 py-2 rounded-xl border border-amber-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-100 outline-none text-sm"
                >
                  <option value="chat">聊天</option>
                  <option value="idea">想法</option>
                  <option value="feedback">反馈</option>
                  <option value="agreement">赞同</option>
                  <option value="question">提问</option>
                </select>
                <input
                  type="text"
                  placeholder="输入消息..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleSendMessage();
                    }
                  }}
                  className="flex-1 px-4 py-2 rounded-xl border border-amber-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-100 outline-none"
                />
                <button
                  onClick={handleSendMessage}
                  className="btn-primary px-6"
                >
                  发送
                </button>
              </div>
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => {
                    setNewMessage('我觉得我们可以这样做：');
                    setMessageType('idea');
                  }}
                  className="text-xs px-3 py-1 bg-purple-100 text-purple-600 rounded-full hover:bg-purple-200"
                >
                  分享想法
                </button>
                <button
                  onClick={() => {
                    setNewMessage('我同意这个观点！');
                    setMessageType('agreement');
                  }}
                  className="text-xs px-3 py-1 bg-green-100 text-green-600 rounded-full hover:bg-green-200"
                >
                  表示赞同
                </button>
                <button
                  onClick={() => {
                    setNewMessage('我有些建议：');
                    setMessageType('feedback');
                  }}
                  className="text-xs px-3 py-1 bg-blue-100 text-blue-600 rounded-full hover:bg-blue-200"
                >
                  给出反馈
                </button>
                <button
                  onClick={() => {
                    setNewMessage('我想问：');
                    setMessageType('question');
                  }}
                  className="text-xs px-3 py-1 bg-amber-100 text-amber-600 rounded-full hover:bg-amber-200"
                >
                  提出问题
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="card text-center py-12">
            <div className="text-4xl mb-2">👥</div>
            <p className="text-gray-500">请先创建一个队伍</p>
            <button
              onClick={() => router.push('/ready-room')}
              className="btn-primary mt-4"
            >
              去备战室
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
