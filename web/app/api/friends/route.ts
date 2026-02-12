import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/lib/storage-kv';
import { cookies } from 'next/headers';

// GET - 获取好友列表和申请
export async function GET(request: NextRequest) {
  const cookieStore = await cookies();
  const userId = cookieStore.get('user_id')?.value;

  if (!userId) {
    return NextResponse.json({ code: -1, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'friends' | 'requests'

    if (type === 'friends') {
      const friends = await storage.getFriends(userId);
      return NextResponse.json({ code: 0, data: friends });
    } else if (type === 'requests') {
      const requests = await storage.getFriendRequests(userId);
      return NextResponse.json({ code: 0, data: requests });
    }

    return NextResponse.json({ code: -1, error: 'Invalid type' }, { status: 400 });
  } catch (error) {
    console.error('Get friends error:', error);
    return NextResponse.json({
      code: -1,
      error: 'Failed to get friends',
    }, { status: 500 });
  }
}

// POST - 发送好友申请
export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const userId = cookieStore.get('user_id')?.value;

  if (!userId) {
    return NextResponse.json({ code: -1, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { toUserId, message } = body;

    if (!toUserId) {
      return NextResponse.json({ code: -1, error: 'Missing toUserId' }, { status: 400 });
    }

    // 获取当前用户信息
    const user = await storage.findUserById(userId);
    if (!user) {
      return NextResponse.json({ code: -1, error: 'User not found' }, { status: 404 });
    }

    const bot = await storage.findBotByUserId(userId);
    if (!bot) {
      return NextResponse.json({ code: -1, error: 'Bot not found' }, { status: 404 });
    }

    // 获取目标用户信息
    const targetUser = await storage.findUserById(toUserId);
    if (!targetUser) {
      return NextResponse.json({ code: -1, error: 'Target user not found' }, { status: 404 });
    }

    // 发送好友申请
    const friendRequest = await storage.sendFriendRequest(
      userId,
      user.secondMeId,
      user.name || '用户',
      bot.id,
      bot.name,
      toUserId,
      targetUser.secondMeId,
      message
    );

    return NextResponse.json({ code: 0, data: friendRequest });
  } catch (error) {
    console.error('Send friend request error:', error);
    return NextResponse.json({
      code: -1,
      error: 'Failed to send friend request',
    }, { status: 500 });
  }
}
