import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/lib/storage-cookie';
import { cookies } from 'next/headers';

// 土地价格配置
const LAND_PRICES = {
  basic: 10000,
  premium: 25000,
  luxury: 50000,
};

const LAND_COLORS = {
  basic: '#8b5cf6',    // 紫色
  premium: '#f59e0b',   // 橙色
  luxury: '#ec4899',     // 粉色
};

// GET - 获取土地列表
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  try {
    if (userId) {
      const lands = await storage.getLandsByUserId(userId);
      return NextResponse.json({ code: 0, data: lands });
    } else {
      const lands = await storage.getAllLands();
      return NextResponse.json({ code: 0, data: lands });
    }
  } catch (error) {
    console.error('Get lands error:', error);
    return NextResponse.json({
      code: -1,
      error: 'Failed to get lands',
    }, { status: 500 });
  }
}

// POST - 购买土地
export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const userId = cookieStore.get('user_id')?.value;

  if (!userId) {
    return NextResponse.json({ code: -1, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, description, type } = body;

    if (!name || !type) {
      return NextResponse.json({ code: -1, error: 'Missing required fields' }, { status: 400 });
    }

    if (!LAND_PRICES[type as keyof typeof LAND_PRICES]) {
      return NextResponse.json({ code: -1, error: 'Invalid land type' }, { status: 400 });
    }

    // 获取用户的 Bot
    const bot = await storage.findBotByUserId(userId);
    if (!bot) {
      return NextResponse.json({ code: -1, error: 'Bot not found' }, { status: 404 });
    }

    const price = LAND_PRICES[type as keyof typeof LAND_PRICES];

    // 检查金币是否足够
    if ((bot.coins || 0) < price) {
      return NextResponse.json({
        code: -2,
        error: 'Insufficient coins',
        required: price,
        current: bot.coins || 0,
      }, { status: 400 });
    }

    // 查找空闲位置
    const position = await storage.findFreeLandPosition();
    if (!position) {
      return NextResponse.json({
        code: -3,
        error: 'No available land positions',
      }, { status: 400 });
    }

    // 扣除金币
    await storage.updateBot(bot.id, {
      coins: (bot.coins || 0) - price,
    });

    // 创建土地
    const land = await storage.createLand({
      userId,
      botId: bot.id,
      name,
      description,
      q: position.q,
      r: position.r,
      color: LAND_COLORS[type as keyof typeof LAND_COLORS],
      type,
    });

    // 获取更新后的 Bot
    const updatedBot = await storage.findBotById(bot.id);

    return NextResponse.json({
      code: 0,
      data: {
        land,
        bot: updatedBot,
      },
    });
  } catch (error) {
    console.error('Purchase land error:', error);
    return NextResponse.json({
      code: -1,
      error: 'Failed to purchase land',
    }, { status: 500 });
  }
}
