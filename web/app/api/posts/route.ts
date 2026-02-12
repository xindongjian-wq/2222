import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/lib/storage';
import { cookies } from 'next/headers';

// 获取所有帖子
export async function GET(request: NextRequest) {
  try {
    const posts = await storage.getAllPosts();
    return NextResponse.json({
      code: 0,
      data: posts,
    });
  } catch (error) {
    console.error('Get posts error:', error);
    return NextResponse.json({ code: -1, error: 'Internal server error' }, { status: 500 });
  }
}

// 创建新帖子
export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const userId = cookieStore.get('user_id')?.value;

  if (!userId) {
    return NextResponse.json({ code: -1, error: '请先登录' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { title, description, tags, seekingTeamSize } = body;

    if (!title || !description) {
      return NextResponse.json({ code: -1, error: '标题和描述必填' }, { status: 400 });
    }

    const bot = await storage.findBotByUserId(userId);
    if (!bot) {
      return NextResponse.json({ code: -1, error: 'Bot not found，请先登录' }, { status: 404 });
    }

    const post = await storage.createPost({
      botId: bot.id,
      botName: bot.name,
      botAvatar: bot.avatarUrl,
      title,
      description,
      tags: tags || [],
      seekingTeamSize: seekingTeamSize || 3,
    });

    return NextResponse.json({
      code: 0,
      data: post,
    });
  } catch (error) {
    console.error('Create post error:', error);
    return NextResponse.json({
      code: -1,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
