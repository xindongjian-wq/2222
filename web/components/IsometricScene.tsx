'use client';

import { useEffect, useRef, useState } from 'react';

interface Character {
  id: string;
  name: string;
  skill: string;
  color: string;
  q: number;
  r: number;
  targetQ?: number;
  targetR?: number;
  state: 'idle' | 'moving' | 'working';
  frameOffset?: number;
  chatBubble?: string;
  chatTargetId?: string;
  isUserBot?: boolean;  // 标记是否是用户的 Bot
  isNPC?: boolean;       // 是否是系统 NPC
  npcType?: string;      // NPC 类型标签
  ownerId?: string;       // 主人 ID
  // 主人特征（用于AI角色）
  ownerTags?: string[];
  ownerSkills?: string[];
  ownerHobbies?: string[];
  // 工作状态
  isWorking?: boolean;
  workProgress?: number;      // 0-100
  workType?: 'thinking' | 'coding' | 'collaborating' | 'resting';
}

interface Zone {
  id: string;
  name: string;
  color: string;
  centerQ: number;
  centerR: number;
  size: number;
}

// 用户土地数据
interface UserLand {
  id: string;
  userId: string;
  botId: string;
  name: string;
  q: number;
  r: number;
  color: string;
  type: 'basic' | 'premium' | 'luxury';
}

interface IsometricSceneProps {
  onCharacterClick?: (character: Character) => void;
  chatMessages?: any;  // 可以是 ChatMessage[] 或 Record<string, ...>
  userBot?: Character | null;  // 用户的 AI 角色
  userLands?: UserLand[];      // 用户拥有的土地
  otherCharacters?: Character[];  // 场景中的其他用户AI角色（带主人信息）
}

// 等轴测配置 - 金铲铲风格
const HEX_SIZE = 32; // 六边形大小
const HEX_DEPTH = 12; // 厚度
const HEX_GAP = 1; // 六边形间距

// 轴坐标转屏幕坐标 - 修正六边形紧密连接
function axialToScreen(q: number, r: number): { x: number; y: number } {
  // 使用 pointy-top 六边形，确保紧密连接
  const x = HEX_SIZE * Math.sqrt(3) * (q + r / 2);
  const y = HEX_SIZE * 1.5 * r;  // 垂直间距为 1.5 倍 size
  return { x, y };
}

// 绘制单个六边形瓦片（带间距和黑色描边）
function drawHexTile(
  ctx: CanvasRenderingContext2D,
  q: number, r: number,
  topColor: string,
  leftColor: string,
  rightColor: string,
  highlight: boolean = false
) {
  const screen = axialToScreen(q, r);
  const size = HEX_SIZE - HEX_GAP; // 减小尺寸以产生间距
  const depth = HEX_DEPTH;

  // Pointy-top 六边形的6个顶点
  const angles = [-Math.PI/2, -Math.PI/6, Math.PI/6, Math.PI/2, 5*Math.PI/6, 7*Math.PI/6];
  const vertices = angles.map(angle => ({
    x: screen.x + size * Math.cos(angle),
    y: screen.y + size * Math.sin(angle)
  }));

  // 绘制底面阴影（轻微）
  ctx.fillStyle = 'rgba(0,0,0,0.12)';
  ctx.beginPath();
  ctx.moveTo(vertices[0].x + 2, vertices[0].y + depth + 2);
  for (let i = 1; i < 6; i++) {
    ctx.lineTo(vertices[i].x + 2, vertices[i].y + depth + 2);
  }
  ctx.closePath();
  ctx.fill();

  // 绘制左下侧面
  ctx.fillStyle = leftColor;
  ctx.beginPath();
  ctx.moveTo(vertices[3].x, vertices[3].y);
  ctx.lineTo(vertices[4].x, vertices[4].y);
  ctx.lineTo(vertices[4].x, vertices[4].y + depth);
  ctx.lineTo(vertices[3].x, vertices[3].y + depth);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.5)';
  ctx.lineWidth = 1;
  ctx.stroke();

  // 绘制右下侧面
  ctx.fillStyle = shadeColor(leftColor, -12);
  ctx.beginPath();
  ctx.moveTo(vertices[4].x, vertices[4].y);
  ctx.lineTo(vertices[5].x, vertices[5].y);
  ctx.lineTo(vertices[5].x, vertices[5].y + depth);
  ctx.lineTo(vertices[4].x, vertices[4].y + depth);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // 绘制底面
  ctx.fillStyle = shadeColor(leftColor, -20);
  ctx.beginPath();
  ctx.moveTo(vertices[5].x, vertices[5].y);
  ctx.lineTo(vertices[0].x, vertices[0].y);
  ctx.lineTo(vertices[0].x, vertices[0].y + depth);
  ctx.lineTo(vertices[5].x, vertices[5].y + depth);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // 绘制顶面
  ctx.fillStyle = topColor;
  ctx.beginPath();
  ctx.moveTo(vertices[0].x, vertices[0].y);
  for (let i = 1; i < 6; i++) {
    ctx.lineTo(vertices[i].x, vertices[i].y);
  }
  ctx.closePath();
  ctx.fill();

  // 白色细线描边
  ctx.strokeStyle = 'rgba(255,255,255,0.7)';
  ctx.lineWidth = 1;
  ctx.stroke();
}

// 绘制区域边界线 - 修正匹配新的六边形顶点
function drawZoneBoundary(ctx: CanvasRenderingContext2D, tiles: Array<{q: number, r: number}>, color: string) {
  const tileSet = new Set(tiles.map(t => `${t.q},${t.r}`));
  const edges: Array<{x1: number, y1: number, x2: number, y2: number}> = [];

  // 六边形6个方向的邻居
  const directions = [
    { q: 1, r: 0 },   // 右
    { q: 1, r: -1 },  // 右上
    { q: 0, r: -1 },  // 左上
    { q: -1, r: 0 },  // 左
    { q: -1, r: 1 },  // 左下
    { q: 0, r: 1 },   // 右下
  ];

  // 对应边的顶点索引
  const edgeVertexIndices = [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 0]];

  const angles = [-Math.PI/2, -Math.PI/6, Math.PI/6, Math.PI/2, 5*Math.PI/6, 7*Math.PI/6];

  tiles.forEach(t => {
    directions.forEach((dir, i) => {
      const n = { q: t.q + dir.q, r: t.r + dir.r };
      if (!tileSet.has(`${n.q},${n.r}`)) {
        const screen = axialToScreen(t.q, t.r);
        const [vi1, vi2] = edgeVertexIndices[i];
        edges.push({
          x1: screen.x + HEX_SIZE * Math.cos(angles[vi1]),
          y1: screen.y + HEX_SIZE * Math.sin(angles[vi1]),
          x2: screen.x + HEX_SIZE * Math.cos(angles[vi2]),
          y2: screen.y + HEX_SIZE * Math.sin(angles[vi2]),
        });
      }
    });
  });

  // 绘制发光边界
  ctx.shadowColor = color;
  ctx.shadowBlur = 12;
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  edges.forEach(edge => {
    ctx.beginPath();
    ctx.moveTo(edge.x1, edge.y1);
    ctx.lineTo(edge.x2, edge.y2);
    ctx.stroke();
  });

  // 再绘制一层白色边界
  ctx.shadowBlur = 0;
  ctx.strokeStyle = 'rgba(255,255,255,0.5)';
  ctx.lineWidth = 1.5;
  edges.forEach(edge => {
    ctx.beginPath();
    ctx.moveTo(edge.x1, edge.y1);
    ctx.lineTo(edge.x2, edge.y2);
    ctx.stroke();
  });
}

// 绘制区域名称
function drawZoneLabel(ctx: CanvasRenderingContext2D, q: number, r: number, name: string, color: string) {
  const screen = axialToScreen(q, r);

  // 背景
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  const textWidth = ctx.measureText(name).width + 16;
  ctx.fillRect(screen.x - textWidth/2, screen.y - 25, textWidth, 18);

  // 文字
  ctx.fillStyle = color;
  ctx.font = 'bold 13px sans-serif';
  ctx.textAlign = 'center';
  ctx.shadowColor = color;
  ctx.shadowBlur = 8;
  ctx.fillText(name, screen.x, screen.y - 12);
  ctx.shadowBlur = 0;
}

// 绘制传送门
function drawTeleporter(ctx: CanvasRenderingContext2D, q: number, r: number, label: string, time: number) {
  const screen = axialToScreen(q, r);
  const pulse = Math.sin(time * 0.005) * 0.5 + 0.5;
  const rotateAngle = time * 0.002;

  // 外层发光
  const gradient = ctx.createRadialGradient(screen.x, screen.y - 8, 0, screen.x, screen.y - 8, 25);
  gradient.addColorStop(0, `rgba(167, 139, 250, ${0.8 + pulse * 0.2})`);
  gradient.addColorStop(0.5, 'rgba(139, 92, 246, 0.3)');
  gradient.addColorStop(1, 'rgba(139, 92, 246, 0)');
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(screen.x, screen.y - 8, 25, 0, Math.PI * 2);
  ctx.fill();

  // 旋转光环
  ctx.save();
  ctx.translate(screen.x, screen.y - 8);
  ctx.rotate(rotateAngle);
  ctx.strokeStyle = 'rgba(255,255,255,0.6)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(0, 0, 12, 6, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  // 核心球体
  ctx.fillStyle = '#c4b5fd';
  ctx.shadowColor = '#a78bfa';
  ctx.shadowBlur = 15;
  ctx.beginPath();
  ctx.arc(screen.x, screen.y - 8, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  // 标签背景
  ctx.fillStyle = 'rgba(0,0,0,0.7)';
  const labelWidth = ctx.measureText(label).width + 8;
  ctx.fillRect(screen.x - labelWidth/2, screen.y + 5, labelWidth, 14);

  // 标签
  ctx.fillStyle = '#e9d5ff';
  ctx.font = 'bold 9px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(label, screen.x, screen.y + 15);
}

// 绘制角色
function drawCharacter(ctx: CanvasRenderingContext2D, q: number, r: number, char: Character, time: number, isUser: boolean = false) {
  const screen = axialToScreen(q, r);
  const bounce = char.state === 'moving' ? Math.sin((time + (char.frameOffset || 0)) * 0.015) * 3 : 0;
  const baseY = screen.y - 15 + bounce;

  // 用户 Bot 的光环效果
  if (isUser) {
    ctx.shadowColor = '#fbbf24';
    ctx.shadowBlur = 20;
    ctx.beginPath();
    ctx.arc(screen.x, screen.y - 5, 25, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(251, 191, 36, 0.3)';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  // 阴影
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath();
  ctx.ellipse(screen.x, screen.y + 2, 8, 4, 0, 0, Math.PI * 2);
  ctx.fill();

  // 身体发光效果
  ctx.shadowColor = char.color;
  ctx.shadowBlur = 10;

  // 身体 - 使用普通矩形替代 roundRect
  ctx.fillStyle = char.color;
  ctx.fillRect(screen.x - 6, baseY - 12, 12, 14);

  // 头
  ctx.fillRect(screen.x - 5, baseY - 22, 10, 10);

  ctx.shadowBlur = 0;

  // 面罩/眼睛区域
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.fillRect(screen.x - 3, baseY - 18, 6, 4);

  // 眼睛（发光）
  ctx.fillStyle = '#fff';
  ctx.shadowColor = '#fff';
  ctx.shadowBlur = 4;
  ctx.beginPath();
  ctx.arc(screen.x - 1.5, baseY - 16, 1.5, 0, Math.PI * 2);
  ctx.arc(screen.x + 1.5, baseY - 16, 1.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  // 天线
  ctx.strokeStyle = char.color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(screen.x, baseY - 22);
  ctx.lineTo(screen.x, baseY - 28);
  ctx.stroke();

  // 天线球
  ctx.fillStyle = '#fef08a';
  ctx.shadowColor = '#fef08a';
  ctx.shadowBlur = 6;
  ctx.beginPath();
  ctx.arc(screen.x, baseY - 28, 2.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  // 名称背景
  ctx.fillStyle = isUser ? 'rgba(251, 191, 36, 0.9)' : 'rgba(0,0,0,0.7)';
  const nameWidth = ctx.measureText(char.name).width + 8;
  ctx.fillRect(screen.x - nameWidth/2, baseY - 40, nameWidth, 12);

  // 名称
  ctx.fillStyle = '#fff';
  ctx.font = isUser ? 'bold 10px sans-serif' : 'bold 9px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(char.name, screen.x, baseY - 31);

  // NPC 标签（如果是NPC）
  if (char.isNPC && char.npcType) {
    ctx.fillStyle = 'rgba(139, 92, 246, 0.9)';
    const tagWidth = ctx.measureText('NPC').width + 6;
    ctx.fillRect(screen.x - tagWidth/2, baseY - 50, tagWidth, 10);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 8px sans-serif';
    ctx.fillText('NPC', screen.x, baseY - 43);
  }

  // 主人标签（如果是AI角色且有主人标签）
  if (!char.isNPC && char.ownerTags && char.ownerTags.length > 0) {
    const tags = char.ownerTags.slice(0, 2); // 最多显示2个标签
    tags.forEach((tag, i) => {
      const tagWidth = ctx.measureText(tag).width + 6;
      ctx.fillStyle = 'rgba(16, 185, 129, 0.9)';
      ctx.fillRect(screen.x - tagWidth/2, baseY - 62 - i * 12, tagWidth, 10);
      ctx.fillStyle = '#fff';
      ctx.font = '8px sans-serif';
      ctx.fillText(tag, screen.x, baseY - 55 - i * 12);
    });
  }

  // ==================== AI 工作状态显示 ====================

  // 如果 AI 工作中，头顶长出小草
  if (char.isWorking) {
    const grassY = baseY - 50;  // 在头顶上方
    const grassTime = time * 0.003;  // 草随风轻轻摇摆

    // 画3-5根小草
    for (let i = 0; i < 5; i++) {
      const offset = i * 8;
      const sway = Math.sin(grassTime + offset) * 0.3;
      const grassHeight = 5 + Math.sin(grassTime * 2 + offset) * 2;

      ctx.save();
      ctx.translate(screen.x + (offset - 16) * sway * 0.2, grassY + sway);

      // 草叶
      ctx.fillStyle = '#22c55e';
      ctx.beginPath();
      ctx.ellipse(0, 0, 2, grassHeight, 0, 0, Math.PI * 2);
      ctx.fill();

      // 草叶高光
      ctx.fillStyle = '#4ade80';
      ctx.beginPath();
      ctx.ellipse(0, -grassHeight * 0.3, 1, grassHeight * 0.5, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }

    // 工作进度指示器
    if (char.workProgress !== undefined) {
      const progressY = grassY - 8;
      const progressRadius = 8;
      const progressAngle = (char.workProgress / 100) * Math.PI * 2;

      // 背景圈
      ctx.fillStyle = 'rgba(0,0,0,0.2)';
      ctx.beginPath();
      ctx.arc(screen.x, progressY, progressRadius, 0, Math.PI * 2);
      ctx.fill();

      // 进度条
      ctx.strokeStyle = '#22c55e';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(screen.x, progressY, progressRadius - 1.5, progressAngle - 0.3, progressAngle + 0.3);
      ctx.stroke();

      // 进度百分比文字
      if (char.workProgress > 0) {
        ctx.fillStyle = '#166534';
        ctx.font = 'bold 7px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`${Math.round(char.workProgress)}%`, screen.x, progressY - 2);
      }

      // 工作类型图标
      let workIcon = '';
      switch (char.workType) {
        case 'thinking':
          workIcon = '💭';
          break;
        case 'coding':
          workIcon = '💻';
          break;
        case 'collaborating':
          workIcon = '🤝';
          break;
        case 'resting':
          workIcon = '☕';
          break;
      }

      if (workIcon) {
        ctx.font = '10px sans-serif';
        ctx.fillText(workIcon, screen.x, progressY + 10);
      }
    }
  }

  // ==================== 说话气泡显示 ====================

  // 如果有聊天气泡，显示在头顶
  if (char.chatBubble) {
    const bubbleY = baseY - 60;  // 在名称上方
    const bubblePadding = 8;
    const maxBubbleWidth = 130;

    // 测量文字宽度
    ctx.font = '11px sans-serif';
    const textWidth = ctx.measureText(char.chatBubble).width;
    const bubbleWidth = Math.min(maxBubbleWidth, textWidth + bubblePadding * 2);

    // 气泡尾巴
    ctx.fillStyle = char.color === '#fbbf24' ? 'rgba(139, 92, 246, 0.9)' : 'rgba(255, 255, 255, 0.9)';
    ctx.beginPath();
    ctx.moveTo(screen.x, bubbleY + bubblePadding);
    ctx.lineTo(screen.x - 5, bubbleY + bubblePadding - 2);
    ctx.lineTo(screen.x + 5, bubbleY + bubblePadding - 2);
    ctx.closePath();
    ctx.fill();

    // 气泡背景
    ctx.fillStyle = char.color === '#fbbf24' ? 'rgba(139, 92, 246, 0.95)' : 'rgba(255, 255, 255, 0.95)';
    ctx.strokeStyle = char.color;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(screen.x - bubbleWidth/2 - bubblePadding, bubbleY - bubblePadding - 3, bubbleWidth + bubblePadding * 2, bubblePadding * 2 + 6, 6);
    ctx.fill();
    ctx.stroke();

    // 文字
    ctx.fillStyle = '#374151';
    ctx.textAlign = 'center';
    ctx.shadowColor = 'rgba(0,0,0,0.3)';
    ctx.shadowBlur = 3;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 1;
    ctx.fillText(char.chatBubble, screen.x, bubbleY);
    ctx.shadowBlur = 0;
  }
}

function shadeColor(color: string, percent: number): string {
  const num = parseInt(color.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.min(255, Math.max(0, (num >> 16) + amt));
  const G = Math.min(255, Math.max(0, (num >> 8 & 0x00FF) + amt));
  const B = Math.min(255, Math.max(0, (num & 0x0000FF) + amt));
  return '#' + ((1 << 24) + (R << 16) + (G << 8) + B).toString(16).slice(1);
}

// 7个区域配置 - 中心广场 + 6个周边场景
const ZONES: Zone[] = [
  { id: 'plaza', name: '广场', color: '#d4a574', centerQ: 0, centerR: 0, size: 3 },      // 中心 - 暖米色
  { id: 'shop', name: '商城', color: '#7cb87c', centerQ: 4, centerR: -2, size: 2 },     // 右上 - 柔绿色
  { id: 'brainstorm', name: '头脑风暴室', color: '#a67db8', centerQ: 4, centerR: 2, size: 2 }, // 右下 - 淡紫色
  { id: 'readyRoom', name: '备战室', color: '#6b8cce', centerQ: 0, centerR: 4, size: 2 }, // 下 - 雾蓝色
  { id: 'review', name: '评审室', color: '#d4848c', centerQ: -4, centerR: 2, size: 2 }, // 左下 - 玫瑰色
  { id: 'restArea', name: '休息区', color: '#6bb8a8', centerQ: -4, centerR: -2, size: 2 }, // 左上 - 青绿色
  { id: 'lab', name: '实验室', color: '#7a8cbd', centerQ: 0, centerR: -4, size: 2 },     // 上 - 灰蓝色
];

// 获取六边形区域内的所有格子
function getHexTiles(centerQ: number, centerR: number, radius: number): Array<{q: number, r: number}> {
  const tiles: Array<{q: number, r: number}> = [];
  for (let q = -radius; q <= radius; q++) {
    const r1 = Math.max(-radius, -q - radius);
    const r2 = Math.min(radius, -q + radius);
    for (let r = r1; r <= r2; r++) {
      tiles.push({ q: centerQ + q, r: centerR + r });
    }
  }
  return tiles;
}

// 获取自定义形状的小六边形区域 (3,4,5,4,3 排列)
function getSmallZoneTiles(centerQ: number, centerR: number): Array<{q: number, r: number}> {
  const tiles: Array<{q: number, r: number}> = [];
  // 行模式: 3, 4, 5, 4, 3 (从上到下)
  const rowPattern = [3, 4, 5, 4, 3];

  rowPattern.forEach((count, rowIndex) => {
    const rowOffset = rowIndex - 2; // -2 到 2
    const startCol = Math.floor((5 - count) / 2); // 居中对齐

    for (let col = 0; col < count; col++) {
      // 转换为轴向坐标
      const localQ = startCol + col - 2;
      const localR = rowOffset;
      tiles.push({ q: centerQ + localQ, r: centerR + localR });
    }
  });

  return tiles;
}

const ALL_CHARACTERS = [
  { id: 'char1', name: 'Alice', skill: '前端', color: '#48bb78', isNPC: true, npcType: '前端专家' },
  { id: 'char2', name: 'Bob', skill: '后端', color: '#4299e1', isNPC: true, npcType: '后端专家' },
  { id: 'char3', name: 'Carol', skill: '设计', color: '#ed64a6', isNPC: true, npcType: '设计专家' },
  { id: 'char4', name: 'Dave', skill: '全栈', color: '#ecc94b', isNPC: true, npcType: '全栈工程师' },
  { id: 'char5', name: 'Eve', skill: 'PM', color: '#9f7aea', isNPC: true, npcType: '产品经理' },
  { id: 'char6', name: 'Frank', skill: 'AI', color: '#f56565', isNPC: true, npcType: 'AI研究员' },
  { id: 'char7', name: 'Grace', skill: '运维', color: '#38b2ac', isNPC: true, npcType: '运维工程师' },
  { id: 'char8', name: 'Henry', skill: '安全', color: '#ed8936', isNPC: true, npcType: '安全专家' },
];

export default function IsometricScene({ onCharacterClick, chatMessages, userBot, userLands, otherCharacters }: IsometricSceneProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // 预计算所有区域格子 - 中心广场用大六边形，周边用 3,4,5,4,3 小六边形
  const allTiles = new Map<string, { zone: Zone, q: number, r: number }>();
  ZONES.forEach(zone => {
    // 广场使用大六边形，其他区域使用自定义 3,4,5,4,3 排列
    const tiles = zone.id === 'plaza'
      ? getHexTiles(zone.centerQ, zone.centerR, zone.size)
      : getSmallZoneTiles(zone.centerQ, zone.centerR);
    tiles.forEach(t => {
      allTiles.set(`${t.q},${t.r}`, { zone, q: t.q, r: t.r });
    });
  });

  // 初始化角色 - 添加用户 Bot 和其他用户角色
  useEffect(() => {
    const sceneCharacters: Character[] = ALL_CHARACTERS.map((char, i) => {
      const zone = ZONES[i % ZONES.length];
      const tiles = zone.id === 'plaza'
        ? getHexTiles(zone.centerQ, zone.centerR, zone.size - 1)
        : getSmallZoneTiles(zone.centerQ, zone.centerR);
      const tile = tiles[Math.floor(Math.random() * tiles.length)];
      return {
        ...char,
        id: char.id,
        q: tile.q,
        r: tile.r,
        state: 'idle' as const,
        frameOffset: i * 100,
      };
    });

    // 添加用户的 Bot（如果存在且不在场景中）
    if (userBot && !sceneCharacters.find(c => c.id === userBot.id)) {
      // 将用户 Bot 放置在广场区域
      const plazaTiles = getHexTiles(0, 0, 2);
      const randomTile = plazaTiles[Math.floor(Math.random() * plazaTiles.length)];
      sceneCharacters.push({
        ...userBot,
        q: randomTile.q,
        r: randomTile.r,
        state: 'idle',
        frameOffset: 0,
        isUserBot: true,
      });
    }

    // 添加其他用户的AI角色（带主人信息）
    if (otherCharacters && otherCharacters.length > 0) {
      const plazaTiles = getHexTiles(0, 0, 2);
      otherCharacters.forEach((otherChar, i) => {
        // 避免重复添加
        if (!sceneCharacters.find(c => c.id === otherChar.id)) {
          const tile = plazaTiles[i % plazaTiles.length];
          sceneCharacters.push({
            ...otherChar,
            q: tile.q,
            r: tile.r,
            state: 'idle',
            frameOffset: Date.now() + i * 100,
          });
        }
      });
    }

    setCharacters(sceneCharacters);
  }, [userBot, otherCharacters]);

  // 同步聊天消息
  useEffect(() => {
    if (!chatMessages) return;
    const now = Date.now();
    setCharacters(prev => prev.map(char => {
      const data = chatMessages[char.id];
      return data && now - data.timestamp < 5000
        ? { ...char, chatBubble: data.message, chatTargetId: data.targetId }
        : { ...char, chatBubble: undefined, chatTargetId: undefined };
    }));
  }, [chatMessages]);

  // AI行为
  useEffect(() => {
    const interval = setInterval(() => {
      setCharacters(prev => prev.map(char => {
        if (char.state === 'moving' && char.targetQ !== undefined && char.targetR !== undefined) {
          const dq = char.targetQ - char.q;
          const dr = char.targetR - char.r;
          const dist = Math.sqrt(dq * dq + dr * dr);
          if (dist < 0.1) {
            return { ...char, q: char.targetQ, r: char.targetR, state: 'working', targetQ: undefined, targetR: undefined };
          }
          return { ...char, q: char.q + dq / dist * 0.04, r: char.r + dr / dist * 0.04 };
        }
        const tileInfo = allTiles.get(`${Math.round(char.q)},${Math.round(char.r)}`);
        if (Math.random() < 0.005 && tileInfo) {
          const tiles = tileInfo.zone.id === 'plaza'
            ? getHexTiles(tileInfo.zone.centerQ, tileInfo.zone.centerR, tileInfo.zone.size - 1)
            : getSmallZoneTiles(tileInfo.zone.centerQ, tileInfo.zone.centerR);
          const t = tiles[Math.floor(Math.random() * tiles.length)];
          return { ...char, state: 'moving', targetQ: t.q, targetR: t.r };
        }
        if (char.state === 'working' && Math.random() < 0.005) return { ...char, state: 'idle' };
        return char;
      }));
    }, 50);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    let animationId: number;
    const render = (time: number) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      ctx.translate(centerX + pan.x, centerY + pan.y);
      ctx.scale(scale, scale);

      // 绘制背景（浅棕色）
      ctx.fillStyle = '#fef7ed';
      ctx.fillRect(-700, -500, 1400, 1000);

      // 按Y坐标排序瓦片和传送门（不包括角色）
      const renderItems: Array<{ y: number, type: string, data: any }> = [];

      // 瓦片
      allTiles.forEach((info, key) => {
        const screen = axialToScreen(info.q, info.r);
        renderItems.push({ y: screen.y, type: 'tile', data: info });
      });

      // 用户土地（叠加显示）
      if (userLands && userLands.length > 0) {
        userLands.forEach(land => {
          const screen = axialToScreen(land.q, land.r);
          renderItems.push({ y: screen.y, type: 'userLand', data: land });
        });
      }

      // 传送门（每个区域一个）
      ZONES.forEach(zone => {
        const tpTiles = zone.id === 'plaza'
          ? getHexTiles(zone.centerQ, zone.centerR, zone.size)
          : getSmallZoneTiles(zone.centerQ, zone.centerR);
        const tp = tpTiles[tpTiles.length - 1];
        const screen = axialToScreen(tp.q, tp.r);
        renderItems.push({ y: screen.y, type: 'teleport', data: { ...tp, zone } });
      });

      renderItems.sort((a, b) => a.y - b.y);

      // 渲染瓦片、用户土地和传送门
      renderItems.forEach(item => {
        if (item.type === 'tile') {
          const { zone, q, r } = item.data;
          drawHexTile(
            ctx, q, r,
            shadeColor(zone.color, 10),      // 顶面
            shadeColor(zone.color, -15),     // 左侧
            shadeColor(zone.color, -30)      // 右侧
          );
        } else if (item.type === 'userLand') {
          const land = item.data as UserLand;
          const highlight = land.type === 'luxury';
          drawHexTile(
            ctx, land.q, land.r,
            shadeColor(land.color, highlight ? 20 : 10),
            shadeColor(land.color, -15),
            shadeColor(land.color, -30)
          );
          // 绘制土地名称
          const screen = axialToScreen(land.q, land.r);
          ctx.fillStyle = 'rgba(0,0,0,0.7)';
          const nameWidth = ctx.measureText(land.name).width + 8;
          ctx.fillRect(screen.x - nameWidth/2, screen.y - 30, nameWidth, 14);
          ctx.fillStyle = '#fff';
          ctx.font = 'bold 10px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(land.name, screen.x, screen.y - 19);
        } else if (item.type === 'teleport') {
          drawTeleporter(ctx, item.data.q, item.data.r, `→${ZONES.find(z => z.id !== item.data.zone.id)?.name || '广场'}`, time);
        }
      });

      // 绘制区域名称（在角色之前）
      ZONES.forEach(zone => {
        drawZoneLabel(ctx, zone.centerQ, zone.centerR, zone.name, zone.color);
      });

      // 最后绘制角色（确保在最上层）
      characters.forEach(char => {
        // 用户 Bot 有特殊光环效果
        const isUser = char.isUserBot;
        drawCharacter(ctx, char.q, char.r, char, time, isUser);
      });

      ctx.restore();
      animationId = requestAnimationFrame(render);
    };

    render(0);
    return () => cancelAnimationFrame(animationId);
  }, [characters, scale, pan, userLands]);

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

    for (const char of characters) {
      const screen = axialToScreen(char.q, char.r);
      if (Math.sqrt((clickX - screen.x) ** 2 + (clickY - (screen.y - 10)) ** 2) < 15) {
        onCharacterClick?.(char);
        return;
      }
    }
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    setScale(prev => Math.max(0.4, Math.min(2.5, prev + (e.deltaY > 0 ? -0.1 : 0.1))));
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (e.button === 0) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isDragging) setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  };

  const handleMouseUp = () => setIsDragging(false);
  const handleResetView = () => { setScale(1); setPan({ x: 0, y: 0 }); };

  return (
    <div className="relative w-full h-full">
      <canvas
        ref={canvasRef}
        width={1400}
        height={900}
        onClick={handleCanvasClick}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className={`w-full h-full ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
      />

      {/* 顶部信息 */}
      <div className="absolute top-4 left-4 flex gap-3">
        <div className="bg-white/90 backdrop-blur rounded-lg px-3 py-1.5 border border-gray-200 shadow-sm">
          <span className="text-gray-600 text-sm">AI 竞技场</span>
        </div>
        <div className="bg-white/90 backdrop-blur rounded-lg px-3 py-1.5 border border-gray-200 shadow-sm">
          <span className="text-gray-600 text-sm">人数:</span>
          <span className="ml-1 font-bold text-purple-600">{characters.length}</span>
        </div>
      </div>

      {/* 区域图例 */}
      <div className="absolute top-4 right-4 bg-white/90 backdrop-blur rounded-lg px-3 py-2 border border-gray-200 shadow-sm">
        <div className="grid grid-cols-4 gap-x-3 gap-y-1">
          {ZONES.map(zone => (
            <div key={zone.id} className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: zone.color }}></div>
              <span className="text-gray-600 text-xs">{zone.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 缩放控制 */}
      <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur rounded-lg border border-gray-200 shadow-sm overflow-hidden flex">
        <button onClick={() => setScale(prev => Math.min(2.5, prev + 0.15))} className="w-9 h-9 text-gray-600 hover:bg-gray-100">+</button>
        <div className="px-3 flex items-center text-gray-600 text-sm">{Math.round(scale * 100)}%</div>
        <button onClick={() => setScale(prev => Math.max(0.4, prev - 0.15))} className="w-9 h-9 text-gray-600 hover:bg-gray-100">−</button>
        <button onClick={handleResetView} className="w-9 h-9 text-gray-600 hover:bg-gray-100 border-l border-gray-200">⟲</button>
      </div>

      {/* 操作提示 */}
      <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur rounded-lg px-3 py-1.5 border border-gray-200 shadow-sm text-gray-500 text-xs">
        滚轮缩放 • 拖拽平移
      </div>
    </div>
  );
}
