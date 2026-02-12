'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';

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
}

interface ViewUser {
  id: string;
  name?: string;
  email?: string;
  avatarUrl?: string;
  tags?: string[];
  skills?: string[];
  hobbies?: string[];
  bio?: string;
}

// 场景预设类型
interface ScenePreset {
  id: string;
  name: string;
  emoji: string;
  category: 'sports' | 'social' | 'entertainment' | 'work' | 'nature' | 'hobby' | 'other';
  color: string;
  baseColor: string;
  description: string;
}

// 用户场景 - 每块地选择一个场景
interface UserScene {
  id: string;
  userId: string;
  landIndex: number; // 0-5，对应6块地
  scenePresetId: string;
  createdAt: string;
  updatedAt: string;
}

// AI推荐场景
interface RecommendedScene {
  id: string;
  name: string;
  emoji: string;
  category: string;
  color: string;
  baseColor: string;
  description: string;
  reason?: string; // 推荐理由
  confidence?: number; // 相关度评分
}

// 等轴测配置
const HEX_SIZE = 85;
const HEX_HEIGHT = 35;
// 已删除HEX_GAP

// 固定6块地的螺旋坐标（围绕中心排列）
const LAND_POSITIONS: { q: number; r: number }[] = [
  { q: 0, r: 0 },     // 第1块 - 中心
  { q: 1, r: 0 },     // 第2块 - 右
  { q: 0, r: 1 },     // 第3块 - 右下
  { q: -1, r: 1 },    // 第4块 - 左下
  { q: -1, r: 0 },    // 第5块 - 左
  { q: 0, r: -1 },    // 第6块 - 左上
];

function axialToScreen(q: number, r: number): { x: number; y: number } {
  const x = HEX_SIZE * Math.sqrt(3) * (q + r / 2);
  const y = HEX_SIZE * 2 * 0.75 * r;
  return { x, y };
}

// 颜色辅助函数
function lightenColor(color: string, percent: number): string {
  const num = parseInt(color.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.min(255, (num >> 16) + amt);
  const G = Math.min(255, ((num >> 8) & 0x00FF) + amt);
  const B = Math.min(255, (num & 0x0000FF) + amt);
  return 'rgb(' + R + ',' + G + ',' + B + ')';
}

function darkenColor(color: string, percent: number): string {
  const num = parseInt(color.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.max(0, (num >> 16) - amt);
  const G = Math.max(0, ((num >> 8) & 0x00FF) - amt);
  const B = Math.max(0, (num & 0x0000FF) - amt);
  return 'rgb(' + R + ',' + G + ',' + B + ')';
}

function draw3DHexTile(
  ctx: CanvasRenderingContext2D,
  q: number,
  r: number,
  baseColor: string,
  sceneEmoji?: string,
  sceneColor?: string,
  isSelected?: boolean,
  index?: number
) {
  const screen = axialToScreen(q, r);
  const size = HEX_SIZE - 1.5;
  const tileColor = sceneColor || baseColor;

  const vertices: { x: number; y: number }[] = [];
  for (let i = 0; i < 6; i++) {
    const angle = (2 * Math.PI / 6) * (i - 0.5);
    const px = screen.x + size * Math.cos(angle);
    const py = screen.y + size * Math.sin(angle);
    vertices.push({ x: px, y: py });
  }

  const thickness = HEX_HEIGHT;
  const p2 = vertices[2];
  const p3 = vertices[3];
  const angleRight = Math.PI / 6;

  ctx.beginPath();
  ctx.moveTo(p2.x, p2.y);
  ctx.lineTo(p3.x, p3.y);
  ctx.lineTo(p3.x + thickness * Math.cos(angleRight), p3.y + thickness * Math.sin(angleRight));
  ctx.lineTo(p2.x + thickness * Math.cos(angleRight), p2.y + thickness * Math.sin(angleRight));
  ctx.closePath();
  ctx.fillStyle = darkenColor(tileColor, 35);
  ctx.fill();

  const p4 = vertices[4];
  const angleLeft = Math.PI / 3;

  ctx.beginPath();
  ctx.moveTo(p3.x, p3.y);
  ctx.lineTo(p4.x, p4.y);
  ctx.lineTo(p4.x + thickness * Math.cos(angleLeft), p4.y + thickness * Math.sin(angleLeft));
  ctx.lineTo(p3.x + thickness * Math.cos(angleRight), p3.y + thickness * Math.sin(angleRight));
  ctx.closePath();
  ctx.fillStyle = darkenColor(tileColor, 25);
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(vertices[0].x, vertices[0].y);
  for (let i = 1; i < 6; i++) {
    ctx.lineTo(vertices[i].x, vertices[i].y);
  }
  ctx.closePath();

  const gradient = ctx.createLinearGradient(
    vertices[0].x, vertices[0].y - 20,
    vertices[3].x, vertices[3].y + 20
  );
  gradient.addColorStop(0, lightenColor(tileColor, 20));
  gradient.addColorStop(0.3, tileColor);
  gradient.addColorStop(1, darkenColor(tileColor, 15));
  ctx.fillStyle = gradient;
  ctx.fill();

  ctx.strokeStyle = isSelected ? '#fbbf24' : 'rgba(255,255,255,0.5)';
  ctx.lineWidth = isSelected ? 3 : 2;
  ctx.stroke();

  if (sceneEmoji) {
    ctx.save();
    ctx.translate(screen.x, screen.y - 10);
    ctx.shadowColor = 'rgba(0,0,0,0.3)';
    ctx.shadowBlur = 12;
    ctx.shadowOffsetY = 6;
    ctx.font = '44px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(sceneEmoji, 0, 0);
    ctx.restore();
  }

  ctx.beginPath();
  ctx.arc(screen.x - size * 0.3, screen.y - size * 0.4, size * 0.15, 0, Math.PI * 2);
  const highlightGrad = ctx.createRadialGradient(
    screen.x - size * 0.3, screen.y - size * 0.4, 0,
    screen.x - size * 0.3, screen.y - size * 0.4, size * 0.15
  );
  highlightGrad.addColorStop(0, 'rgba(255,255,255,0.6)');
  highlightGrad.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = highlightGrad;
  ctx.fill();

  if (index !== undefined) {
    const badgeX = screen.x + size * 0.55;
    const badgeY = screen.y - size * 0.55;

    ctx.beginPath();
    ctx.arc(badgeX, badgeY, 18, 0, Math.PI * 2);
    ctx.fillStyle = isSelected ? '#f59e0b' : '#8b5cf6';
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 15px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(index + 1), badgeX, badgeY);
  }
}

export default function MySpacePage() {
  const router = useRouter();
  const params = useParams<{ userId?: string }>();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [user, setUser] = useState<User | null>(null);
  const [bot, setBot] = useState<Bot | null>(null);
  const [viewUser, setViewUser] = useState<ViewUser | null>(null);  // 查看的其他用户
  const [userScenes, setUserScenes] = useState<UserScene[]>([]);
  const [scenePresets, setScenePresets] = useState<ScenePreset[]>([]);
  const [selectedLandIndex, setSelectedLandIndex] = useState<number | null>(null);
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });

  // 扩展场景相关状态
  const [extendedScenes, setExtendedScenes] = useState<any[]>([]);
  const [sceneMode, setSceneMode] = useState<'basic' | 'extended'>('basic');  // basic = 基础60种, extended = 扩展300+种
  const [extendedCategory, setExtendedCategory] = useState<'all' | 'sports' | 'social' | 'entertainment' | 'work' | 'nature' | 'hobby' | 'space'>('all');
  const [extendedSearch, setExtendedSearch] = useState('');

  // 场景选择弹窗状态
  const [showSceneModal, setShowSceneModal] = useState(false);
  const [hoveredLandIndex, setHoveredLandIndex] = useState<number | null>(null);

  // AI推荐场景状态
  const [showRecommendModal, setShowRecommendModal] = useState(false);
  const [recommendations, setRecommendations] = useState<RecommendedScene[]>([]);
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(false);

  // 分类
  const categories = [
    { value: 'sports', label: '运动', emoji: '🏀', color: 'bg-orange-100 text-orange-700' },
    { value: 'social', label: '社交', emoji: '☕', color: 'bg-amber-100 text-amber-700' },
    { value: 'entertainment', label: '娱乐', emoji: '🎬', color: 'bg-pink-100 text-pink-700' },
    { value: 'work', label: '办公', emoji: '🏢', color: 'bg-blue-100 text-blue-700' },
    { value: 'nature', label: '自然', emoji: '🌳', color: 'bg-green-100 text-green-700' },
    { value: 'hobby', label: '兴趣', emoji: '🎨', color: 'bg-purple-100 text-purple-700' },
  ];

  // 加载数据
  useEffect(() => {
    loadData();
  }, [params.userId]);

  const loadData = async () => {
    try {
      const targetUserId = params.userId;  // URL参数中的用户ID

      // 如果有userId参数，尝试加载该用户的信息（查看模式）
      if (targetUserId) {
        const viewUserRes = await fetch(`/api/user/view?userId=${targetUserId}`);
        if (viewUserRes.ok) {
          const viewUserData = await viewUserRes.json();
          if (viewUserData.code === 0) {
            setViewUser(viewUserData.data.user);
            // 加载该用户的Bot和场景
            setBot(viewUserData.data.bot);
            const userScenes = viewUserData.data.scenes || [];
            setUserScenes(userScenes);
          }
        }
      }

      // 加载场景预设（无论查看模式还是编辑模式都需要）
      const scenesRes = await fetch('/api/scenes');
      if (scenesRes.ok) {
        const scenesData = await scenesRes.json();
        setScenePresets(scenesData.data || []);
      }

      // 加载扩展场景预设
      try {
        const extendedRes = await fetch('/api/scenes/extended');
        if (extendedRes.ok) {
          const extendedData = await extendedRes.json();
          setExtendedScenes(extendedData.data || []);
        }
      } catch (e) {
        console.error('Failed to load extended scenes:', e);
      }

      // 如果没有目标userId（查看自己的空间），加载自己的数据
      if (!targetUserId) {
        // 加载当前登录用户信息
        const userRes = await fetch('/api/user');
        let userId: string | null = null;
        if (userRes.ok) {
          const userData = await userRes.json();
          if (userData.code === 0) {
            setUser(userData.data.user);
            setBot(userData.data.bot);
            userId = userData.data.user?.id || null;
          }
        }

        // 加载用户的6块地场景
        if (userId) {
          const userScenesRes = await fetch(`/api/scenes/user/${userId}`);
          if (userScenesRes.ok) {
            const userScenesData = await userScenesRes.json();
            setUserScenes(userScenesData.data || []);
          }
        }
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  };

  // 加载AI推荐场景
  const loadRecommendations = async (landIndex: number) => {
    setIsLoadingRecommendations(true);
    try {
      const res = await fetch(`/api/scenes/recommend?userId=${user?.id}&landIndex=${landIndex}`);
      if (res.ok) {
        const data = await res.json();
        if (data.code === 0) {
          setRecommendations(data.data.recommendations || []);
        }
      }
    } catch (e) {
      console.error('Failed to load recommendations:', e);
    } finally {
      setIsLoadingRecommendations(false);
    }
  };

  // 设置场景
  const handleSetScene = async (scenePresetId: string, isRecommended = false, sceneData?: any) => {
    if (selectedLandIndex === null) return;
    try {
      const requestBody: any = {
        landIndex: selectedLandIndex,
        scenePresetId,
      };

      // 如果是AI推荐场景，传递场景数据
      if (isRecommended && sceneData) {
        requestBody.sceneData = sceneData;
      }

      const res = await fetch('/api/scenes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.code === 0) {
          setUserScenes(prev => {
            const updated = [...prev];
            updated[selectedLandIndex] = data.data;
            return updated;
          });
          // 关闭两个弹窗
          setShowSceneModal(false);
          setShowRecommendModal(false);
          setSelectedLandIndex(null);
        }
      }
    } catch (error) {
      console.error('Failed to set scene:', error);
    }
  };

  // 跳过推荐，直接选择场景
  const handleSkipToManual = () => {
    setShowRecommendModal(false);
    setShowSceneModal(true);
  };

  // 选择推荐场景
  const handleSelectRecommendation = (scene: RecommendedScene) => {
    // 创建临时场景ID（用于设置场景）
    const tempSceneId = scene.id;
    // 传递完整场景数据以便后端创建动态场景
    handleSetScene(tempSceneId, true, scene);
  };

  // Canvas 渲染
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 设置canvas大小
    canvas.width = 1400;
    canvas.height = 900;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      ctx.translate(700 + pan.x, 380 + pan.y);
      ctx.scale(scale, scale);

      // 绘制背景
      const bgGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, 800);
      bgGradient.addColorStop(0, '#f1f5f9');
      bgGradient.addColorStop(1, '#e2e8f0');
      ctx.fillStyle = bgGradient;
      ctx.fillRect(-700, -500, 1400, 1000);

      // 先绘制所有阴影
      LAND_POSITIONS.forEach((pos) => {
        const screen = axialToScreen(pos.q, pos.r);
        ctx.beginPath();
        ctx.ellipse(screen.x, screen.y + HEX_SIZE + 15, HEX_SIZE * 0.85, HEX_SIZE * 0.25, 0, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0,0,0,0.08)';
        ctx.fill();
      });

      // 绘制6块地（按顺序从后往前，确保正确的遮挡关系）
      const drawOrder = [3, 4, 2, 5, 1, 0];
      drawOrder.forEach((originalIndex) => {
        const pos = LAND_POSITIONS[originalIndex];
        const userScene = userScenes[originalIndex];
        // 同时查找基础场景和扩展场景
        const scenePreset = userScene
          ? [...scenePresets, ...extendedScenes].find(s => s.id === userScene.scenePresetId)
          : null;

        const isMine = Boolean(user || viewUser);
        const isSelected = selectedLandIndex === originalIndex;

        const isHovered = hoveredLandIndex === originalIndex;
        draw3DHexTile(
          ctx, pos.q, pos.r,
          scenePreset?.baseColor || '#94a3b8',
          scenePreset?.emoji,
          scenePreset?.color,
          isSelected || isHovered,
          isMine ? originalIndex : undefined
        );
      });

      ctx.restore();
    };

    render();
  }, [userScenes, scenePresets, extendedScenes, selectedLandIndex, hoveredLandIndex, scale, pan, user, viewUser]);

  // 处理点击选择地块
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const rawX = (e.clientX - rect.left) * scaleX - canvas.width / 2 - pan.x;
    const rawY = (e.clientY - rect.top) * scaleY - canvas.height / 2 - pan.y;
    const clickX = rawX / scale;
    const clickY = rawY / scale;

    LAND_POSITIONS.forEach((pos, index) => {
      const screen = axialToScreen(pos.q, pos.r);
      if (Math.sqrt((clickX - screen.x) ** 2 + (clickY - screen.y) ** 2) < HEX_SIZE * 0.85) {
        if (canEdit) {
          setSelectedLandIndex(index);
          // 先加载AI推荐，然后显示推荐弹窗
          loadRecommendations(index);
          setShowRecommendModal(true);
        } else {
          // 观看模式：显示提示
          const userScene = userScenes[index];
          // 同时查找基础场景和扩展场景
          const scenePreset = userScene
            ? [...scenePresets, ...extendedScenes].find(s => s.id === userScene.scenePresetId)
            : null;
          const sceneName = scenePreset ? scenePreset.name : '未设置场景';
          alert(`地块 ${index + 1}: ${sceneName}\n${scenePreset ? scenePreset.description : ''}`);
        }
        return;
      }
    });

    setSelectedLandIndex(null);
  };

  // 滚轮缩放
  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    setScale(prev => Math.max(0.4, Math.min(2.5, prev + (e.deltaY > 0 ? -0.1 : 0.1))));
  };

  // 拖拽平移
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (e.button === 0) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isDragging) {
      setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
    } else {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const rawX = (e.clientX - rect.left) * scaleX - canvas.width / 2 - pan.x;
      const rawY = (e.clientY - rect.top) * scaleY - canvas.height / 2 - pan.y;
      const mouseX = rawX / scale;
      const mouseY = rawY / scale;

      let foundHover = null;
      LAND_POSITIONS.forEach((pos, index) => {
        const screen = axialToScreen(pos.q, pos.r);
        const dist = Math.sqrt((mouseX - screen.x) ** 2 + (mouseY - screen.y) ** 2);
        if (dist < HEX_SIZE * 0.85) {
          foundHover = index;
        }
      });
      setHoveredLandIndex(foundHover);
    }
  };

  const handleMouseUp = () => setIsDragging(false);
  const handleMouseLeave = () => setHoveredLandIndex(null);

  // 如果正在加载数据且没有数据，显示加载状态
  const isLoading = !user && !viewUser;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <p className="text-gray-600 mb-4">加载中...</p>
        </div>
      </div>
    );
  }

  // 是否可以编辑（只有查看自己的空间时可以编辑）
  const canEdit = !viewUser && Boolean(user);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航 */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-4">
            <button onClick={() => router.push('/arena')} className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="font-medium">地脉</span>
            </button>
            <h1 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              {viewUser ? `查看 ${viewUser.name || '用户'} 的空间` : '我的空间'}
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-400 to-orange-500 rounded-full">
              <span className="text-2xl">💰</span>
              <span className="text-white font-bold text-lg">{bot?.coins || 0}</span>
            </div>
            {viewUser ? (
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs font-bold">
                  {(viewUser.name || 'U')[0]}
                </div>
                <span className="text-sm text-gray-700 font-medium">{viewUser?.name || viewUser?.email || '用户'}</span>
              </div>
            ) : user ? (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full shadow-md">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs font-bold">
                  {(user?.name || 'U')[0]}
                </div>
                <span className="text-sm text-gray-700 font-medium">{user?.name || user?.email || '用户'}</span>
              </div>
            ) : null}
          </div>
        </div>
      </header>

      <main className="flex h-[calc(100vh-64px)]">
        {/* 左侧 - 等轴测地图 */}
        <div className="flex-1 flex justify-center items-center bg-gradient-to-br from-slate-100 via-slate-50 to-slate-200 relative overflow-hidden">
          <canvas
            ref={canvasRef}
            width={1400}
            height={900}
            onClick={handleCanvasClick}
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
            className="w-full h-full cursor-pointer"
          />

          {/* 地图控制面板 */}
          <div className="absolute bottom-6 left-6 bg-white/90 backdrop-blur-md rounded-2xl px-5 py-4 shadow-xl border border-gray-100">
            <div className="flex items-center gap-3">
              <button onClick={() => setScale(prev => Math.min(3, prev + 0.15))} className="w-11 h-11 bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-xl hover:from-purple-600 hover:to-purple-700 transition-all shadow-md flex items-center justify-center text-xl font-bold">+</button>
              <div className="px-4 py-2 bg-gray-100 rounded-lg min-w-[60px] text-center"><span className="text-gray-700 font-semibold">{Math.round(scale * 100)}%</span></div>
              <button onClick={() => setScale(prev => Math.max(0.5, prev - 0.15))} className="w-11 h-11 bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-xl hover:from-purple-600 hover:to-purple-700 transition-all shadow-md flex items-center justify-center text-xl font-bold">-</button>
              <button onClick={() => { setScale(1); setPan({ x: 0, y: 0 }); }} className="w-11 h-11 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-all flex items-center justify-center text-lg">⟲</button>
            </div>
            <p className="text-xs text-gray-500 mt-3 text-center">
              {canEdit ? '🖱️ 点击地块管理场景 | 滚轮缩放 | 拖拽平移' : '👁️ 点击地块查看详情 | 滚轮缩放 | 拖拽平移'}
            </p>
          </div>
        </div>
      </main>

      {/* AI推荐场景弹窗 - 三选一 */}
      {showRecommendModal && selectedLandIndex !== null && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[60]" onClick={() => setShowRecommendModal(false)}>
          <div className="bg-white rounded-3xl p-8 w-[520px] max-w-[90vw] shadow-2xl" onClick={(e) => e.stopPropagation()}>
            {/* 头部 */}
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl mb-4 shadow-lg">
                <span className="text-4xl">🤖</span>
              </div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
                AI 为你推荐了3个场景
              </h2>
              <p className="text-gray-500 text-sm">
                根据你的 Second Me 记忆和兴趣智能生成
              </p>
            </div>

            {/* 推荐场景列表 */}
            {isLoadingRecommendations ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-gray-500">AI 正在分析你的记忆...</p>
              </div>
            ) : (
              <div className="space-y-3 mb-6">
                {recommendations.map((scene, idx) => (
                  <button
                    key={scene.id}
                    onClick={() => handleSelectRecommendation(scene)}
                    className="group w-full p-4 rounded-xl border-2 border-gray-100 hover:border-purple-400 hover:bg-purple-50 transition-all text-left relative overflow-hidden"
                  >
                    {/* 匹配度指示器 */}
                    {scene.confidence && (
                      <div className="absolute top-0 left-0 h-full bg-gradient-to-b from-green-400 to-green-500 w-1.5"></div>
                    )}
                    <div className="flex items-center gap-4">
                      <span className="text-4xl group-hover:scale-110 transition-transform">{scene.emoji}</span>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-gray-800">{scene.name}</span>
                          {scene.confidence && (
                            <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full font-medium">
                              {Math.round(scene.confidence * 100)}%匹配
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">{scene.description}</p>
                        {scene.reason && (
                          <p className="text-xs text-purple-600 mt-1.5 flex items-center gap-1">
                            <span>💡</span>
                            <span>{scene.reason}</span>
                          </p>
                        )}
                      </div>
                      <div className="w-8 h-8 rounded-full bg-gray-100 group-hover:bg-purple-500 group-hover:text-white transition-all flex items-center justify-center text-gray-400">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* 底部操作 */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
              <button
                onClick={handleSkipToManual}
                className="text-gray-500 hover:text-gray-700 text-sm font-medium px-4 py-2 hover:bg-gray-50 rounded-lg transition-all"
              >
                跳过，自己选择 →
              </button>
              {!isLoadingRecommendations && recommendations.length > 0 && (
                <span className="text-xs text-gray-400">
                  点击场景即可应用
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 场景选择弹窗 */}
      {showSceneModal && selectedLandIndex !== null && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setShowSceneModal(false)}>
          <div className="bg-white rounded-2xl p-6 w-[500px] max-h-[80vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span>🎨</span>
              <span>为地块 {selectedLandIndex + 1} 选择场景</span>
            </h2>

            {/* 场景类型选择 */}
            <div className="flex gap-2 mb-4 bg-gray-50 p-2 rounded-lg">
              <button
                onClick={() => setSceneMode('basic')}
                className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
                  sceneMode === 'basic' ? 'bg-purple-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                基础场景 (60种)
              </button>
              <button
                onClick={() => setSceneMode('extended')}
                className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
                  sceneMode === 'extended' ? 'bg-purple-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                扩展场景 (300+种)
              </button>
            </div>

            {/* 分类选择 - 基础场景 */}
            {sceneMode === 'basic' && (
              <>
                {/* 分类选择 */}
                <div className="space-y-4">
                  {categories.map(cat => (
                    <div key={cat.value}>
                      <h3 className="font-medium text-gray-700 mb-2 flex items-center gap-2">
                        <span>{cat.emoji}</span>
                        <span>{cat.label}类场景</span>
                      </h3>
                      <div className="grid grid-cols-4 gap-2">
                        {scenePresets
                          .filter(s => s.category === cat.value)
                          .map(scene => (
                            <button
                              key={scene.id}
                              onClick={() => handleSetScene(scene.id)}
                              className={`p-3 rounded-lg border-2 transition-all ${
                                userScenes[selectedLandIndex]?.scenePresetId === scene.id
                                  ? 'border-green-500 bg-green-50 ring-2 ring-green-500'
                                  : 'border-gray-200 hover:border-purple-300 hover:bg-purple-50'
                              }`}
                            >
                              <span className="text-2xl block">{scene.emoji}</span>
                              <span className="text-sm font-medium">{scene.name}</span>
                              <span className="text-xs text-gray-500">{scene.description}</span>
                            </button>
                          ))}
                      </div>

                    </div>

                  ))}
                </div>

              </>
            )}

            {/* 分类选择 - 扩展场景 */}
            {sceneMode === 'extended' && (
              <div className="mb-4">
                <input
                  type="text"
                  placeholder="搜索场景..."
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 mb-4"
                  onChange={(e) => setExtendedSearch(e.target.value)}
                  value={extendedSearch}
                />

                <div className="space-y-4">
                  {/* 快速分类 */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    <button
                      onClick={() => setExtendedCategory('all')}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                        extendedCategory === 'all' ? 'bg-purple-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      全部
                    </button>
                    <button
                      onClick={() => setExtendedCategory('sports')}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                        extendedCategory === 'sports' ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      运动
                    </button>
                    <button
                      onClick={() => setExtendedCategory('social')}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                        extendedCategory === 'social' ? 'bg-amber-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      社交
                    </button>
                    <button
                      onClick={() => setExtendedCategory('entertainment')}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                        extendedCategory === 'entertainment' ? 'bg-pink-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      娱乐
                    </button>
                    <button
                      onClick={() => setExtendedCategory('work')}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                        extendedCategory === 'work' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      办公
                    </button>
                    <button
                      onClick={() => setExtendedCategory('nature')}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                        extendedCategory === 'nature' ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      自然
                    </button>
                    <button
                      onClick={() => setExtendedCategory('hobby')}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                        extendedCategory === 'hobby' ? 'bg-purple-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      兴趣
                    </button>
                    <button
                      onClick={() => setExtendedCategory('space')}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                        extendedCategory === 'space' ? 'bg-indigo-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      太空
                    </button>
                  </div>

                </div>


                {/* 扩展场景列表 */}
                <div className="max-h-[50vh] overflow-y-auto space-y-2 pr-2">
                  {extendedScenes
                    .filter(scene => {
                      if (extendedCategory === 'all') return true;
                      return scene.category === extendedCategory;
                    })
                    .slice(0, 50)
                    .map(scene => (
                      <button
                        key={scene.id}
                        onClick={() => handleSetScene(scene.id)}
                        className={`w-full p-3 rounded-lg border-2 transition-all text-left flex items-center gap-3 ${
                          userScenes[selectedLandIndex]?.scenePresetId === scene.id
                            ? 'border-green-500 bg-green-50'
                            : 'border-gray-200 hover:border-purple-300 hover:bg-purple-50'
                        }`}
                      >
                        <span className="text-2xl">{scene.emoji}</span>
                        <div className="flex-1">
                          <span className="font-medium text-sm">{scene.name}</span>
                          <span className="text-xs text-gray-500">{scene.description}</span>
                        </div>

                      </button>
                    ))}
                </div>

              </div>

            )}
          </div>

        </div>
      )}
    </div>
  );
}
