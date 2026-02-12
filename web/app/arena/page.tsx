'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import IsometricScene from '@/components/IsometricScene';
import ChatMessageList, { ChatMessage, getCharacterColor } from '@/components/ChatMessage';

interface User {
  id: string;
  name?: string;
  email?: string;
  avatarUrl?: string;
}

interface Bot {
  id: string;
  name: string;
  coins: number;
  userId: string;
}

interface Land {
  id: string;
  userId: string;
  botId: string;
  name: string;
  description?: string;
  q: number;
  r: number;
  color: string;
  type: 'basic' | 'premium' | 'luxury';
}

interface Idea {
  id: string;
  botId: string;
  botName: string;
  content: string;
  category: string;
  tags: string[];
  quality?: number;
  coinsEarned: number;
  likes: number;
  likedBy: string[];
  createdAt: string;
}

interface Commit {
  id: string;
  author: string;
  message: string;
  timestamp: number;
}

// 每日奖励状态
interface DailyRewardStatus {
  userId: string;
  lastLoginDate: string;
  lastOnlineTime: number;
  totalOnlineMinutes: number;
  totalDailyCoins: number;
}

// 角色详情类型
interface CharacterDetail {
  id: string;
  name: string;
  color: string;
  skill?: string;
  isNPC?: boolean;
  npcType?: string;
  ownerId?: string;
  ownerTags?: string[];
  ownerSkills?: string[];
  ownerHobbies?: string[];
}

// 等轴测场景配置
const ZONES = [
  { id: 'plaza', name: '广场', color: '#d4a574' },
  { id: 'shop', name: '商城', color: '#7cb87c' },
  { id: 'brainstorm', name: '头脑风暴室', color: '#a67db8' },
  { id: 'readyRoom', name: '备战室', color: '#6b8cce' },
  { id: 'review', name: '评审室', color: '#d4848c' },
  { id: 'restArea', name: '休息区', color: '#6bb8a8' },
  { id: 'lab', name: '实验室', color: '#7a8cbd' },
];

export default function ArenaPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [bot, setBot] = useState<Bot | null>(null);
  const [userLands, setUserLands] = useState<Land[]>([]);
  // 新的聊天消息系统 - 每个对话保留所有消息
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [selectedCharacter, setSelectedCharacter] = useState<CharacterDetail | null>(null);
  const [chatViewMode, setChatViewMode] = useState<'chat' | 'commits' | 'earnings'>('chat');
  const [userBot, setUserBot] = useState<any>(null);
  // 场景中其他用户的AI角色
  const [otherCharacters, setOtherCharacters] = useState<any[]>([]);

  // 每日奖励状态
  const [dailyRewardStatus, setDailyRewardStatus] = useState<DailyRewardStatus | null>(null);
  const [canClaimOnlineReward, setCanClaimOnlineReward] = useState(false);

  // 聊天输入状态
  const [chatInput, setChatInput] = useState('');

  // 思路提交状态
  const [ideaInput, setIdeaInput] = useState('');
  const [ideaCategory, setIdeaCategory] = useState<'architecture' | 'feature' | 'optimization' | 'design' | 'ai' | 'product'>('architecture');
  const [ideaTags, setIdeaTags] = useState('');
  const [isSubmittingIdea, setIsSubmittingIdea] = useState(false);
  const [userIdeas, setUserIdeas] = useState<Idea[]>([]);

  // 模拟提交记录
  const [commits, setCommits] = useState<Commit[]>([]);

  const categories: { value: typeof ideaCategory; label: string; color: string }[] = [
    { value: 'architecture', label: '架构设计', color: 'bg-blue-500' },
    { value: 'feature', label: '功能建议', color: 'bg-green-500' },
    { value: 'optimization', label: '性能优化', color: 'bg-yellow-500' },
    { value: 'design', label: 'UI/UX设计', color: 'bg-pink-500' },
    { value: 'ai', label: 'AI应用', color: 'bg-purple-500' },
    { value: 'product', label: '产品思路', color: 'bg-orange-500' },
  ];

  // 加载用户数据
  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const userRes = await fetch('/api/user');
      console.log('[Arena] User API response status:', userRes.status);
      if (userRes.ok) {
        const userData = await userRes.json();
        console.log('[Arena] User data:', userData);
        if (userData.code === 0) {
          setUser(userData.data.user);
          setBot(userData.data.bot);

          // 创建用户 Bot 用于场景显示
          if (userData.data.bot) {
            setUserBot({
              id: userData.data.bot.id,
              name: userData.data.bot.name,
              skill: '开发者',
              color: '#fbbf24',
              isUserBot: true,
            });

            // 加载用户土地
            const landsRes = await fetch(`/api/lands?userId=${userData.data.user.id}`);
            if (landsRes.ok) {
              const landsData = await landsRes.json();
              setUserLands(landsData.data || []);
            }

            // 加载用户思路
            const ideasRes = await fetch(`/api/ideas?botId=${userData.data.bot.id}`);
            if (ideasRes.ok) {
              const ideasData = await ideasRes.json();
              setUserIdeas(ideasData.data || []);
            }

            // 加载每日奖励状态
            const dailyRes = await fetch('/api/daily-reward');
            if (dailyRes.ok) {
              const dailyData = await dailyRes.json();
              if (dailyData.code === 0) {
                setDailyRewardStatus(dailyData.data);
              }
            }

            // 自动切换到金币获取视图
            setChatViewMode('earnings');
          }
        }

        // 加载其他用户的AI角色（带主人信息）
        const botsRes = await fetch('/api/bots');
        if (botsRes.ok) {
          const botsData = await botsRes.json();
          // 过滤出NPC和用户AI角色
          if (botsData.data && Array.isArray(botsData.data)) {
            const otherChars = botsData.data
              .filter((b: any) => b.userId !== userData.data.user?.id && b.isNPC === true)
              .map((b: any) => ({
                id: b.id,
                name: b.name,
                color: b.skin?.color || '#0ea5e9',
                skill: b.ownerSkills?.[0] || '开发者',
                ownerId: b.userId,
                isNPC: b.isNPC || false,
                npcType: b.npcType,
                ownerTags: b.ownerTags || [],
                ownerSkills: b.ownerSkills || [],
                ownerHobbies: b.ownerHobbies || [],
              }));
            setOtherCharacters(otherChars);
          }
        }
      }
    } catch (error) {
      console.error('Failed to load user data:', error);
    }
  };

  // 发送聊天消息（使用新的消息系统）
  const handleSendMessage = async () => {
    if (!chatInput.trim() || !bot) return;

    const newMessage: ChatMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      characterId: 'user',
      characterName: bot.name || '我',
      characterColor: '#8b5cf6',
      message: chatInput,
      timestamp: Date.now(),
      isUser: true,
    };

    setChatMessages(prev => [...prev, newMessage]);
    setChatInput('');

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: chatInput }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.code === 0 && data.reply) {
          const replyMessage: ChatMessage = {
            id: `msg_${Date.now()}_${Math.random().toString(36).substring(7)}`,
            characterId: 'user',
            characterName: bot.name || 'AI助手',
            characterColor: '#8b5cf6',
            message: data.reply,
            timestamp: Date.now(),
            isUser: true,
          };
          setChatMessages(prev => [...prev, replyMessage]);
        }
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  // 领取每日登录奖励
  const handleClaimLoginReward = async () => {
    if (!user) return;
    try {
      const res = await fetch('/api/daily-reward', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'login' }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.code === 0) {
          if (bot) {
            setBot({ ...bot, coins: bot.coins + data.data.coins });
          }
          setDailyRewardStatus(prev => prev ? { ...prev, lastLoginDate: new Date().toISOString().split('T')[0] } : null);
          alert(data.data.message);
        } else if (data.code === -1) {
          alert(data.data?.message || data.error || '领取失败');
        }
      }
    } catch (error) {
      console.error('Failed to claim login reward:', error);
    }
  };

  // 领取在线时长奖励
  const handleClaimOnlineReward = async () => {
    if (!user) return;
    try {
      const res = await fetch('/api/daily-reward', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'online' }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.code === 0) {
          if (bot) {
            setBot({ ...bot, coins: bot.coins + data.data.coins });
          }
          setDailyRewardStatus(prev => prev ? { ...prev, lastOnlineTime: Date.now(), totalOnlineMinutes: data.data.totalMinutes } : null);
          alert(data.data.message);
        } else if (data.code === -1) {
          alert(data.data?.message || data.error || '领取失败');
        }
      }
    } catch (error) {
      console.error('Failed to claim online reward:', error);
    }
  };

  // 在线奖励定时器（每分钟检查一次）
  useEffect(() => {
    if (!user) return;

    // 检查是否可以领取在线奖励
    const checkOnlineReward = () => {
      if (!dailyRewardStatus) return;
      const minutesPassed = Math.floor((Date.now() - dailyRewardStatus.lastOnlineTime) / 60000);
      setCanClaimOnlineReward(minutesPassed >= 1);
    };

    // 每秒检查一次
    const interval = setInterval(checkOnlineReward, 10000);

    // 立即检查一次
    checkOnlineReward();

    return () => clearInterval(interval);
  }, [user, dailyRewardStatus]);

  // 提交思路
  const handleSubmitIdea = async () => {
    if (!ideaInput.trim() || isSubmittingIdea || !user) return;

    setIsSubmittingIdea(true);
    try {
      const res = await fetch('/api/ideas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: ideaInput,
          category: ideaCategory,
          tags: ideaTags.split(',').map(t => t.trim()).filter(Boolean),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.code === 0) {
          setUserIdeas(prev => [data.data.idea, ...prev]);
          // 更新 Bot 的金币显示
          if (data.data.bot) {
            setBot(data.data.bot);
          }
        }
      }
    } catch (error) {
      console.error('Failed to submit idea:', error);
    } finally {
      setIsSubmittingIdea(false);
      setIdeaInput('');
      setIdeaTags('');
    }
  };

  // 点赞思路
  const handleLikeIdea = async (ideaId: string) => {
    try {
      const res = await fetch(`/api/ideas/${ideaId}/like`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        if (data.code === 0) {
          setUserIdeas(prev => prev.map(idea => idea.id === ideaId ? data.data : idea));
        }
      }
    } catch (error) {
      console.error('Failed to like idea:', error);
    }
  };

  // 购买土地
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [landName, setLandName] = useState('');
  const [landType, setLandType] = useState<'basic' | 'premium' | 'luxury'>('basic');
  const [landDescription, setLandDescription] = useState('');

  const landPrices = { basic: 10000, premium: 25000, luxury: 50000 };
  const canAffordLand = bot && bot.coins >= landPrices[landType];

  const handleBuyLand = async () => {
    if (!landName.trim()) return;

    try {
      const res = await fetch('/api/lands', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: landName,
          type: landType,
          description: landDescription,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.code === 0) {
          setUserLands(prev => [...prev, data.data.land]);
          setBot(data.data.bot);
          setShowBuyModal(false);
          setLandName('');
          setLandDescription('');
        } else if (data.code === -2) {
          alert(`金币不足！需要 ${data.required}，当前 ${data.current}`);
        }
      }
    } catch (error) {
      console.error('Failed to buy land:', error);
    }
  };

  // 发送好友申请
  const handleSendFriendRequest = async (targetUserId: string) => {
    if (!user || !bot) return;

    try {
      const res = await fetch('/api/friends', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toUserId: targetUserId,
          message: '你好，我想加你为好友！',
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.code === 0) {
          alert('好友申请已发送！');
        } else {
          alert(data.error || '发送失败');
        }
      }
    } catch (error) {
      console.error('Failed to send friend request:', error);
    }
  };

  // 模拟其他角色的对话（使用新的消息系统）
  useEffect(() => {
    const characters = [
      { id: 'char1', name: '代码大师', color: '#ef4444' },
      { id: 'char2', name: '设计专家', color: '#f59e0b' },
      { id: 'char3', name: '测试小能手', color: '#eab308' },
      { id: 'char4', name: '架构师', color: '#22c55e' },
      { id: 'char5', name: '产品经理', color: '#06b6d4' },
      { id: 'char6', name: 'AI研究员', color: '#3b82f6' },
      { id: 'char7', name: '性能优化师', color: '#8b5cf6' },
      { id: 'char8', name: '全栈开发者', color: '#ec4899' },
    ];
    const messages = [
      '你好！有人想一起组队吗？', '我刚才完成了一个很酷的功能！',
      '这个架构设计得好好优化一下', '测试用例写完了吗？',
      '用户反馈说加载速度有点慢', '新功能需求下来了',
      '代码评审通过了！', '今晚一起头脑风暴吧',
      '这个API接口设计很合理', '上线前要再检查一遍',
    ];

    const interval = setInterval(() => {
      const randomChar = characters[Math.floor(Math.random() * characters.length)];
      const randomMessage = messages[Math.floor(Math.random() * messages.length)];

      const newMessage: ChatMessage = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        characterId: randomChar.id,
        characterName: randomChar.name,
        characterColor: randomChar.color,
        message: randomMessage,
        timestamp: Date.now(),
      };

      setChatMessages(prev => [...prev, newMessage]);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // 模拟提交记录
  useEffect(() => {
    const mockCommits: Commit[] = [
      { id: '1', author: 'Alice', message: 'feat: 添加用户认证功能', timestamp: Date.now() - 3600000 },
      { id: '2', author: 'Bob', message: 'fix: 修复API路由错误', timestamp: Date.now() - 7200000 },
      { id: '3', author: 'Carol', message: 'style: 更新首页样式', timestamp: Date.now() - 10800000 },
      { id: '4', author: 'Dave', message: 'refactor: 重构组件结构', timestamp: Date.now() - 14400000 },
      { id: '5', author: 'Eve', message: 'docs: 更新README文档', timestamp: Date.now() - 18000000 },
    ];
    setCommits(mockCommits);
  }, []);

  return (
    <div className="h-screen flex bg-gray-50 overflow-hidden">
      {/* 左侧场景 */}
      <div className="flex-1 relative">
        <IsometricScene
          onCharacterClick={setSelectedCharacter}
          chatMessages={chatMessages}
          userBot={userBot}
          userLands={userLands}
          otherCharacters={otherCharacters}
        />

        {/* 顶部导航 */}
        <div className="absolute top-0 left-0 right-0 bg-white/90 backdrop-blur border-b border-gray-200 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <span className="text-xl">🏟</span>
              <span>AI 竞技场</span>
            </h1>
            <nav className="flex gap-4">
              <button onClick={() => router.push('/shop')} className="text-gray-600 hover:text-gray-900 text-sm font-medium">
                商城
              </button>
              <button onClick={() => router.push('/my-space')} className="text-gray-600 hover:text-gray-900 text-sm font-medium">
                我的空间
              </button>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            {/* 金币显示 */}
            {bot && (
              <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-400 to-orange-500 rounded-full">
                <span className="text-xl">💰</span>
                <span className="text-white font-bold">{bot.coins.toLocaleString()}</span>
              </div>
            )}

            {/* 用户信息 */}
            {user ? (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-full">
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user.name || '用户'} className="w-6 h-6 rounded-full" />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs font-bold">
                    {(user.name || 'U')[0]}
                  </div>
                )}
                <span className="text-sm text-gray-700 font-medium">{user.name || user.email || '用户'}</span>
              </div>
            ) : (
              <button
                onClick={() => router.push('/')}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm font-medium"
              >
                登录
              </button>
            )}

            {/* 我的空间链接 */}
            {bot && (
              <button
                onClick={() => router.push('/my-space')}
                className="px-3 py-1.5 bg-green-500 text-white rounded-lg hover:bg-green-600 text-sm font-medium flex items-center gap-1"
              >
                <span>🏔️</span>
                <span>我的空间</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 右侧聊天面板 */}
      <div className="w-96 bg-white border-l border-gray-200 flex flex-col">
        {/* 视图切换 */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setChatViewMode('chat')}
            className={`flex-1 py-3 text-sm font-medium ${
              chatViewMode === 'chat'
                ? 'text-purple-600 border-b-2 border-purple-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            💬 聊天
          </button>
          <button
            onClick={() => setChatViewMode('commits')}
            className={`flex-1 py-3 text-sm font-medium ${
              chatViewMode === 'commits'
                ? 'text-purple-600 border-b-2 border-purple-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            📝 提交
          </button>
          <button
            onClick={() => setChatViewMode('earnings')}
            className={`flex-1 py-3 text-sm font-medium ${
              chatViewMode === 'earnings'
                ? 'text-purple-600 border-b-2 border-purple-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            💰 金币获取
          </button>
        </div>

        {/* 聊天视图 */}
        {chatViewMode === 'chat' && (
          <>
            <ChatMessageList messages={chatMessages} currentUserId={user?.id} />

            <div className="p-4 border-t border-gray-200">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="输入消息..."
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                  disabled={!user}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!chatInput.trim() || !user}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                >
                  发送
                </button>
              </div>
              {!user && (
                <p className="text-xs text-gray-500 mt-2 text-center">请先登录以发送消息</p>
              )}
            </div>
          </>
        )}

        {/* 提交视图 */}
        {chatViewMode === 'commits' && (
          <div className="flex-1 overflow-y-auto p-4">
            <h3 className="font-medium text-gray-800 mb-3">最近提交</h3>
            <div className="space-y-3">
              {commits.map(commit => (
                <div key={commit.id} className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-sm text-gray-800">{commit.author}</span>
                    <span className="text-xs text-gray-500">
                      {new Date(commit.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{commit.message}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 金币获取视图 */}
        {chatViewMode === 'earnings' && (
          <div className="flex-1 flex flex-col overflow-hidden">
            {!user ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <div className="text-3xl mb-2">🔒</div>
                  <p className="text-sm">请先登录以获取金币</p>
                  <button
                    onClick={() => router.push('/')}
                    className="mt-3 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm font-medium"
                  >
                    前往登录
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* 思路提交表单 */}
                <div className="p-4 border-b border-gray-200">
                  <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                    <span>💡</span>
                    <span>提交软件开发思路</span>
                    <span className="text-xs text-purple-600 bg-purple-100 px-2 py-0.5 rounded-full">+50~250金币</span>
                  </h3>
                  <textarea
                    value={ideaInput}
                    onChange={(e) => setIdeaInput(e.target.value)}
                    placeholder="分享你的技术见解、架构设计思路或产品想法..."
                    className="w-full p-3 border border-gray-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-500"
                    rows={3}
                  />
                  <div className="flex items-center gap-2 mt-3">
                    <select
                      value={ideaCategory}
                      onChange={(e) => setIdeaCategory(e.target.value as typeof ideaCategory)}
                      className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      {categories.map(cat => (
                        <option key={cat.value} value={cat.value}>{cat.label}</option>
                      ))}
                    </select>
                    <input
                      type="text"
                      value={ideaTags}
                      onChange={(e) => setIdeaTags(e.target.value)}
                      placeholder="标签 (逗号分隔)"
                      className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    <button
                      onClick={handleSubmitIdea}
                      disabled={!ideaInput.trim() || isSubmittingIdea}
                      className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-medium hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    >
                      {isSubmittingIdea ? '提交中...' : '提交'}
                    </button>
                  </div>
                </div>

                {/* 思路列表 */}
                <div className="flex-1 overflow-y-auto p-4">
                  <h3 className="font-medium text-gray-800 mb-3 text-sm">我的思路</h3>
                  <div className="space-y-3">
                    {userIdeas.length === 0 ? (
                      <div className="text-center text-gray-500 py-8">
                        <div className="text-3xl mb-2">💭</div>
                        <p className="text-sm">还没有提交过思路</p>
                        <p className="text-xs text-gray-400 mt-1">提交有价值的思路可以获得金币</p>
                      </div>
                    ) : (
                      userIdeas.map(idea => {
                        const category = categories.find(c => c.value === idea.category);
                        return (
                          <div key={idea.id} className="p-3 bg-gray-50 rounded-lg border border-gray-100 hover:border-purple-200 transition-colors">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <span className={`px-2 py-0.5 rounded text-xs text-white ${category?.color || 'bg-gray-500'}`}>
                                  {category?.label || idea.category}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {new Date(idea.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                <span className="text-sm font-bold text-amber-600">+{idea.coinsEarned}</span>
                                <span className="text-xs">💰</span>
                              </div>
                            </div>
                            <p className="text-sm text-gray-700 mb-2">{idea.content}</p>
                            <div className="flex items-center justify-between">
                              <div className="flex flex-wrap gap-1">
                                {idea.tags.slice(0, 3).map(tag => (
                                  <span key={tag} className="text-xs text-gray-500">#{tag}</span>
                                ))}
                              </div>
                              <button
                                onClick={() => handleLikeIdea(idea.id)}
                                className={`flex items-center gap-1 text-xs ${
                                  idea.likedBy.includes(bot?.id || '') ? 'text-red-500' : 'text-gray-400 hover:text-red-500'
                                }`}
                              >
                                <span>{idea.likedBy.includes(bot?.id || '') ? '❤️' : '🤍'}</span>
                                <span>{idea.likes}</span>
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* 每日奖励 */}
                <div className="p-4 border-t border-gray-200 space-y-3">
                  <h3 className="font-medium text-gray-800 mb-2">🎁 每日奖励</h3>

                  {/* 每日登录奖励 */}
                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <div className="text-sm text-gray-600">每日登录奖励</div>
                        <div className="text-xs text-gray-500">每天登录可获得</div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-amber-600">+2000 💰</div>
                        {dailyRewardStatus?.lastLoginDate === new Date().toISOString().split('T')[0] ? (
                          <div className="text-xs text-green-600 mt-1">✓ 今日已领取</div>
                        ) : (
                          <button
                            onClick={handleClaimLoginReward}
                            className="mt-1 px-3 py-1.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm rounded-lg hover:from-purple-600 hover:to-pink-600 shadow-md"
                          >
                            领取奖励
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 在线时长奖励 */}
                  <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <div className="text-sm text-gray-600">在线时长奖励</div>
                        <div className="text-xs text-gray-500">每在线1分钟获得5金币</div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-blue-600">
                          +{dailyRewardStatus?.totalDailyCoins || 0} 💰
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          今日在线 {dailyRewardStatus?.totalOnlineMinutes || 0} 分钟
                        </div>
                      </div>
                    </div>
                    <div className="mt-2">
                      {canClaimOnlineReward ? (
                        <button
                          onClick={handleClaimOnlineReward}
                          className="w-full px-3 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-sm rounded-lg hover:from-blue-600 hover:to-cyan-600 shadow-md animate-pulse"
                        >
                          领取在线奖励 ({Math.floor((Date.now() - (dailyRewardStatus?.lastOnlineTime || 0)) / 60000)} 分钟)
                        </button>
                      ) : (
                        <div className="w-full px-3 py-2 bg-gray-200 text-gray-500 text-sm rounded-lg text-center">
                          在线时间不足1分钟
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 提示信息 */}
                  <div className="text-center">
                    <p className="text-xs text-gray-500">
                      💡 提示：每天登录可获得2000金币，每在线1分钟获得5金币
                    </p>
                  </div>
                </div>

                {/* 购买土地按钮 */}
                <div className="p-4 border-t border-gray-200">
                  <button
                    onClick={() => setShowBuyModal(true)}
                    className="w-full py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg font-medium hover:from-green-600 hover:to-emerald-600 shadow-lg flex items-center justify-center gap-2"
                  >
                    <span>🏔️</span>
                    <span>购买土地 (10000金币起)</span>
                  </button>
                  {userLands.length > 0 && (
                    <p className="text-xs text-gray-500 mt-2 text-center">已拥有 {userLands.length} 块土地</p>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* 角色详情弹窗 */}
      {selectedCharacter && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setSelectedCharacter(null)}>
          <div className="bg-white rounded-2xl p-6 w-[420px] max-h-[80vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
            {/* 头部 */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: selectedCharacter.color }}
                >
                  <span className="text-2xl">🤖</span>
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-800">{selectedCharacter.name}</h2>
                  {selectedCharacter.npcType && (
                    <span className="inline-block ml-2 px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full">
                      NPC
                    </span>
                  )}
                  {selectedCharacter.skill && (
                    <p className="text-sm text-gray-500">{selectedCharacter.skill}</p>
                  )}
                </div>
              </div>
              <button
                onClick={() => setSelectedCharacter(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* NPC固定信息 */}
            {selectedCharacter.isNPC ? (
              <div className="bg-purple-50 rounded-xl p-4 mb-4">
                <h3 className="font-bold text-purple-800 mb-2 flex items-center gap-2">
                  <span className="text-lg">📋</span>
                  <span>NPC 信息</span>
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">类型</span>
                    <span className="font-medium text-gray-800">{selectedCharacter.npcType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">技能</span>
                    <span className="font-medium text-gray-800">{selectedCharacter.skill}</span>
                  </div>
                  <p className="text-gray-500 text-xs mt-2">
                    我是系统NPC，随时可以和你交流讨论技术问题！
                  </p>
                </div>
              </div>
            ) : (
              /* AI角色的主人信息 */
              <>
                {selectedCharacter.ownerTags && selectedCharacter.ownerTags.length > 0 && (
                  <div className="bg-amber-50 rounded-xl p-4 mb-4">
                    <h3 className="font-bold text-amber-800 mb-2 flex items-center gap-2">
                      <span className="text-lg">🏷️</span>
                      <span>主人标签</span>
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedCharacter.ownerTags.map((tag, i) => (
                        <span key={i} className="px-2 py-1 bg-amber-200 text-amber-800 text-xs rounded-full">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {selectedCharacter.ownerSkills && selectedCharacter.ownerSkills.length > 0 && (
                  <div className="bg-blue-50 rounded-xl p-4 mb-4">
                    <h3 className="font-bold text-blue-800 mb-2 flex items-center gap-2">
                      <span className="text-lg">🛠️</span>
                      <span>主人技能</span>
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedCharacter.ownerSkills.map((skill, i) => (
                        <span key={i} className="px-2 py-1 bg-blue-200 text-blue-800 text-xs rounded-full">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {selectedCharacter.ownerHobbies && selectedCharacter.ownerHobbies.length > 0 && (
                  <div className="bg-green-50 rounded-xl p-4 mb-4">
                    <h3 className="font-bold text-green-800 mb-2 flex items-center gap-2">
                      <span className="text-lg">🎨</span>
                      <span>主人爱好</span>
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedCharacter.ownerHobbies.map((hobby, i) => (
                        <span key={i} className="px-2 py-1 bg-green-200 text-green-800 text-xs rounded-full">
                          {hobby}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {/* 观看空间建设 */}
                <button
                  onClick={() => {
                    if (selectedCharacter.ownerId) {
                      // 跳转到该用户的我的空间页面（查看模式）
                      router.push(`/my-space?userId=${selectedCharacter.ownerId}`);
                    }
                  }}
                  className="w-full py-2.5 bg-gradient-to-r from-emerald-500 to-green-500 text-white rounded-lg font-medium hover:from-emerald-600 hover:to-green-600 flex items-center justify-center gap-2 mb-4"
                >
                  <span className="text-lg">🏔</span>
                  <span>观赏空间建设</span>
                </button>
              </>
            )}

            {/* 操作按钮 */}
            <div className="flex gap-3 pt-4 border-t border-gray-200">
              {!selectedCharacter.isNPC && user && selectedCharacter.ownerId && selectedCharacter.ownerId !== user.id && (
                <button
                  onClick={() => selectedCharacter.ownerId && handleSendFriendRequest(selectedCharacter.ownerId)}
                  className="flex-1 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-medium hover:from-purple-600 hover:to-pink-600 flex items-center justify-center gap-2"
                >
                  <span className="text-lg">👋</span>
                  <span>申请好友</span>
                </button>
              )}
              {selectedCharacter.isNPC && (
                <button
                  onClick={() => {
                    alert(`可以和 ${selectedCharacter.name} 讨论关于${selectedCharacter.skill}的话题！`);
                  }}
                  className="flex-1 py-2.5 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 flex items-center justify-center gap-2"
                >
                  <span className="text-lg">💬</span>
                  <span>发起对话</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 购买土地弹窗 */}
      {showBuyModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setShowBuyModal(false)}>
          <div className="bg-white rounded-2xl p-6 w-96 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span className="text-lg">🏔</span>
              <span>购买土地</span>
            </h2>

            <div className="space-y-4">
              {/* 土地类型选择 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">土地类型</label>
                <div className="grid grid-cols-3 gap-2">
                  {([
                    { type: 'basic' as const, name: '基础地块', color: 'bg-purple-500', price: 10000 },
                    { type: 'premium' as const, name: '高级地块', color: 'bg-orange-500', price: 25000 },
                    { type: 'luxury' as const, name: '奢华地块', color: 'bg-pink-500', price: 50000 },
                  ]).map(({ type: t, name, price }) => (
                    <button
                      key={t}
                      onClick={() => setLandType(t)}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        landType === t ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="text-2xl mb-1">🏔️</div>
                      <div className="text-xs font-medium text-gray-700">{name}</div>
                      <div className="text-xs text-gray-500">{price.toLocaleString()}金币</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* 土地名称 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">土地名称</label>
                <input
                  type="text"
                  value={landName}
                  onChange={(e) => setLandName(e.target.value)}
                  placeholder="我的创意之地"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {/* 描述 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">描述（可选）</label>
                <textarea
                  value={landDescription}
                  onChange={(e) => setLandDescription(e.target.value)}
                  placeholder="这块土地的用途..."
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-500"
                  rows={2}
                />
              </div>

              {/* 余额显示 */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-600">当前余额</span>
                <span className="font-bold text-lg text-amber-600">{bot?.coins || 0} 💰</span>
              </div>

              {/* 按钮 */}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowBuyModal(false)}
                  className="flex-1 py-2.5 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  取消
                </button>
                <button
                  onClick={handleBuyLand}
                  disabled={!landName.trim() || !canAffordLand}
                  className={`flex-1 py-2.5 rounded-lg font-medium text-white ${
                    canAffordLand ? 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600' : 'bg-gray-300 cursor-not-allowed'
                  } disabled:opacity-50`}
                >
                  {canAffordLand ? `购买 ${landPrices[landType].toLocaleString()}💰` : '金币不足'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
