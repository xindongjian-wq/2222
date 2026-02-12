import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/lib/storage-cookie';
import { cookies } from 'next/headers';

// 获取我的队伍
export async function GET(request: NextRequest) {
  const cookieStore = await cookies();
  const userId = cookieStore.get('user_id')?.value;

  if (!userId) {
    return NextResponse.json({ code: -1, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const bot = await storage.findBotByUserId(userId);
    if (!bot) {
      return NextResponse.json({ code: -1, error: 'Bot not found' }, { status: 404 });
    }

    const allTeams = await storage.getAllTeams();
    // 找到用户所在的队伍（通过帖子关联）
    const myTeams = allTeams.filter(t => t.postId);

    return NextResponse.json({
      code: 0,
      data: myTeams,
    });
  } catch (error) {
    console.error('Get teams error:', error);
    return NextResponse.json({ code: -1, error: 'Internal server error' }, { status: 500 });
  }
}

// 创建队伍
export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const userId = cookieStore.get('user_id')?.value;

  if (!userId) {
    return NextResponse.json({ code: -1, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, postId } = body;

    if (!name) {
      return NextResponse.json({ code: -1, error: '队伍名称必填' }, { status: 400 });
    }

    const bot = await storage.findBotByUserId(userId);
    if (!bot) {
      return NextResponse.json({ code: -1, error: 'Bot not found' }, { status: 404 });
    }

    const team = await storage.createTeam({
      name,
      leaderId: bot.id,
      members: [bot.id],
      postId,
      status: 'forming',
    });

    return NextResponse.json({
      code: 0,
      data: team,
    });
  } catch (error) {
    console.error('Create team error:', error);
    return NextResponse.json({ code: -1, error: 'Internal server error' }, { status: 500 });
  }
}
