import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/lib/storage';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const userId = cookieStore.get('user_id')?.value;

  if (!userId) {
    return NextResponse.json({ code: -1, error: '请先登录' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { itemId, type, value } = body;

    if (!type || !value) {
      return NextResponse.json({ code: -1, error: '缺少参数' }, { status: 400 });
    }

    const bot = await storage.findBotByUserId(userId);
    if (!bot) {
      return NextResponse.json({ code: -1, error: 'Bot not found' }, { status: 404 });
    }

    const currentSkin = bot.skin || { color: '#0ea5e9', style: 'default', accessories: [] };

    // 根据类型更新装备
    if (type === 'color') {
      await storage.updateBot(bot.id, {
        skin: { ...currentSkin, color: value }
      });
    } else if (type === 'style') {
      await storage.updateBot(bot.id, {
        skin: { ...currentSkin, style: value }
      });
    } else if (type === 'accessory') {
      // 配饰是累加的
      const accessories = currentSkin.accessories || [];
      if (!accessories.includes(value)) {
        accessories.push(value);
      }
      await storage.updateBot(bot.id, {
        skin: { ...currentSkin, accessories }
      });
    } else if (type === 'title') {
      // 称号是累加的
      const titles = bot.titles || [];
      if (!titles.includes(value)) {
        titles.push(value);
      }
      await storage.updateBot(bot.id, { titles });
    }

    return NextResponse.json({ code: 0 });
  } catch (error) {
    console.error('Equip error:', error);
    return NextResponse.json({
      code: -1,
      error: 'Internal server error',
    }, { status: 500 });
  }
}
