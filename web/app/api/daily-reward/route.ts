import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/lib/storage';
import { cookies } from 'next/headers';

// GET - 获取每日奖励状态
export async function GET(request: NextRequest) {
  const cookieStore = await cookies();
  const userId = cookieStore.get('user_id')?.value;

  if (!userId) {
    return NextResponse.json({ code: -1, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const status = await storage.getDailyRewardStatus(userId);
    return NextResponse.json({ code: 0, data: status });
  } catch (error) {
    console.error('Get daily reward status error:', error);
    return NextResponse.json({
      code: -1,
      error: 'Failed to get daily reward status',
    }, { status: 500 });
  }
}

// POST - 领取每日登录奖励
export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const userId = cookieStore.get('user_id')?.value;

  if (!userId) {
    return NextResponse.json({ code: -1, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { type } = body; // 'login' | 'online'

    if (type === 'login') {
      const result = await storage.claimDailyLogin(userId);
      return NextResponse.json({ code: result.success ? 0 : -1, data: result });
    } else if (type === 'online') {
      const result = await storage.claimOnlineReward(userId);
      return NextResponse.json({ code: result.success ? 0 : -1, data: result });
    }

    return NextResponse.json({ code: -1, error: 'Invalid reward type' }, { status: 400 });
  } catch (error) {
    console.error('Claim daily reward error:', error);
    return NextResponse.json({
      code: -1,
      error: 'Failed to claim daily reward',
    }, { status: 500 });
  }
}
