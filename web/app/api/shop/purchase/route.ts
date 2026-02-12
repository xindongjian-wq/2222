import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/lib/storage';
import { cookies } from 'next/headers';

// 商品价格表
const ITEM_PRICES: Record<string, number> = {
  // 颜色
  color_red: 50,
  color_blue: 50,
  color_green: 50,
  color_purple: 100,
  color_pink: 100,
  color_gold: 200,
  color_rainbow: 500,
  // 风格
  style_round: 100,
  style_square: 100,
  style_glowing: 300,
  // 配饰
  acc_glasses: 150,
  acc_hat: 150,
  acc_crown: 500,
  acc_wings: 400,
  // 称号
  title_first: 100,
  title_team: 200,
  title_creative: 300,
  title_champion: 1000,
};

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const userId = cookieStore.get('user_id')?.value;

  if (!userId) {
    return NextResponse.json({ code: -1, error: '请先登录' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { itemId } = body;

    if (!itemId) {
      return NextResponse.json({ code: -1, error: '缺少 itemId' }, { status: 400 });
    }

    const price = ITEM_PRICES[itemId];
    if (!price) {
      return NextResponse.json({ code: -1, error: '商品不存在' }, { status: 404 });
    }

    const bot = await storage.findBotByUserId(userId);
    if (!bot) {
      return NextResponse.json({ code: -1, error: 'Bot not found' }, { status: 404 });
    }

    if (bot.coins < price) {
      return NextResponse.json({ code: -1, error: '金币不足' }, { status: 400 });
    }

    // 解析商品类型
    const [type, value] = itemId.split('_').reduce((acc: { type: string; value: string }, part: string, i: number, arr: string[]) => {
      if (i === 0) acc.type = part;
      else acc.value = arr.slice(1).join('_');
      return acc;
    }, { type: '', value: '' });

    // 扣除金币
    await storage.updateBot(bot.id, {
      coins: bot.coins - price,
    });

    // 根据类型添加到对应的集合
    if (type === 'title') {
      const titles = bot.titles || [];
      if (!titles.includes(value)) {
        titles.push(value);
        await storage.updateBot(bot.id, { titles });
      }
    } else if (type === 'acc') {
      const accessories = bot.skin?.accessories || [];
      if (!accessories.includes(value)) {
        accessories.push(value);
        await storage.updateBot(bot.id, {
          skin: { ...bot.skin!, accessories }
        });
      }
    }
    // 颜色和风格可以直接使用，不需要单独存储已购买状态

    return NextResponse.json({
      code: 0,
      data: {
        remainingCoins: bot.coins - price,
        itemId,
      },
    });
  } catch (error) {
    console.error('Purchase error:', error);
    return NextResponse.json({
      code: -1,
      error: 'Internal server error',
    }, { status: 500 });
  }
}
