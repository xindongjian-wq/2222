import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/lib/storage-cookie';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const scene = searchParams.get('scene');

    // 获取所有 Bot
    const allBots = await storage.getAllBots();

    // 如果指定了场景，返回该场景的 Bot；否则返回所有 Bot
    let bots = allBots;
    if (scene) {
      bots = allBots.filter((bot: any) => bot.currentScene === scene);
    }

    // 模拟其他 AI 在不同场景活动
    // 为每个场景添加一些"虚拟地脉"让场景更热闹
    const virtualBots = generateVirtualBots(scene || 'plaza');

    return NextResponse.json({
      code: 0,
      data: [...bots, ...virtualBots],
    });
  } catch (error) {
    console.error('Get bots error:', error);
    return NextResponse.json({
      code: -1,
      error: 'Internal server error',
    }, { status: 500 });
  }
}

// 生成虚拟地脉 Bot 让场景更热闹
function generateVirtualBots(scene: string) {
  const virtualBotData: Record<string, any[]> = {
    plaza: [
      { id: 'v_bot_1', name: '小团子', skin: { color: '#ef4444', style: 'default', accessories: [] }, level: 5, mood: 'happy', status: 'idle' },
      { id: 'v_bot_2', name: '糖豆', skin: { color: '#3b82f6', style: 'round', accessories: [] }, level: 8, mood: 'happy', status: 'idle' },
      { id: 'v_bot_3', name: '棉花糖', skin: { color: '#22c55e', style: 'default', accessories: [] }, level: 12, mood: 'excited', status: 'idle' },
      { id: 'v_bot_4', name: '雪球', skin: { color: '#f472b6', style: 'round', accessories: [] }, level: 6, mood: 'happy', status: 'idle' },
    ],
    shop: [
      { id: 'v_bot_5', name: '奶茶', skin: { color: '#ec4899', style: 'round', accessories: [] }, level: 6, mood: 'happy', status: 'idle' },
      { id: 'v_bot_6', name: '布丁', skin: { color: '#a855f7', style: 'default', accessories: [] }, level: 15, mood: 'excited', status: 'idle' },
      { id: 'v_bot_7', name: '泡芙', skin: { color: '#fbbf24', style: 'round', accessories: [] }, level: 9, mood: 'happy', status: 'idle' },
    ],
    readyRoom: [
      { id: 'v_bot_8', name: '麻薯', skin: { color: '#f59e0b', style: 'square', accessories: [] }, level: 10, mood: 'focused', status: 'idle' },
      { id: 'v_bot_9', name: '蛋挞', skin: { color: '#14b8a6', style: 'default', accessories: [] }, level: 20, mood: 'happy', status: 'idle' },
    ],
    discussionRoom: [
      { id: 'v_bot_10', name: '甜甜', skin: { color: '#8b5cf6', style: 'round', accessories: [] }, level: 7, mood: 'thinking', status: 'idle' },
      { id: 'v_bot_11', name: '软软', skin: { color: '#f97316', style: 'default', accessories: [] }, level: 9, mood: 'excited', status: 'idle' },
      { id: 'v_bot_12', name: '糯糯', skin: { color: '#06b6d4', style: 'round', accessories: [] }, level: 11, mood: 'happy', status: 'idle' },
    ],
    judgeRoom: [
      { id: 'v_bot_13', name: '小星星', skin: { color: '#6366f1', style: 'square', accessories: [] }, level: 25, mood: 'focused', status: 'idle' },
      { id: 'v_bot_14', name: '萌萌', skin: { color: '#dc2626', style: 'default', accessories: [] }, level: 18, mood: 'thinking', status: 'idle' },
    ],
  };

  return (virtualBotData[scene] || []).map((bot, i) => ({
    ...bot,
    userId: `virtual_${i}`,
    currentScene: scene,
    avatarUrl: undefined,
    xp: bot.level * 100,
    coins: bot.level * 50,
    titles: bot.level > 10 ? ['创意之星'] : [],
    isNPC: true,  // 标记为NPC
    npcType: bot.name.substring(0, 4),  // 使用名字前4个字作为NPC类型
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }));
}
