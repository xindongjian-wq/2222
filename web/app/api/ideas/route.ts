import { NextRequest, NextResponse } from 'next/server';
import { storage, type IdeaType } from '@/lib/storage';
import { cookies } from 'next/headers';

// GET - 获取思路列表
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const botId = searchParams.get('botId');
  const recent = searchParams.get('recent');

  try {
    if (botId) {
      const ideas = await storage.getIdeasByBotId(botId);
      return NextResponse.json({ code: 0, data: ideas });
    } else if (recent) {
      const ideas = await storage.getRecentIdeas(parseInt(recent) || 20);
      return NextResponse.json({ code: 0, data: ideas });
    } else {
      const ideas = await storage.getAllIdeas('approved');
      return NextResponse.json({ code: 0, data: ideas });
    }
  } catch (error) {
    console.error('Get ideas error:', error);
    return NextResponse.json({
      code: -1,
      error: 'Failed to get ideas',
    }, { status: 500 });
  }
}

// POST - 创建新思路（获得金币）
export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const userId = cookieStore.get('user_id')?.value;

  if (!userId) {
    return NextResponse.json({ code: -1, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { content, category, tags } = body;

    if (!content || !category) {
      return NextResponse.json({ code: -1, error: 'Missing required fields' }, { status: 400 });
    }

    // 获取用户的 Bot
    const bot = await storage.findBotByUserId(userId);
    if (!bot) {
      return NextResponse.json({ code: -1, error: 'Bot not found' }, { status: 404 });
    }

    const idea = await storage.createIdea({
      botId: bot.id,
      botName: bot.name,
      userId,
      content,
      category,
      tags: tags || [],
    });

    // 获取更新后的 Bot 信息
    const updatedBot = await storage.findBotById(bot.id);

    return NextResponse.json({
      code: 0,
      data: {
        idea,
        bot: updatedBot,
      },
    });
  } catch (error) {
    console.error('Create idea error:', error);
    return NextResponse.json({
      code: -1,
      error: 'Failed to create idea',
    }, { status: 500 });
  }
}
