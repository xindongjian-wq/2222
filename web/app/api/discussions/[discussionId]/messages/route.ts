import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/lib/storage-cookie';
import { cookies } from 'next/headers';

// 获取讨论消息
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ discussionId: string }> }
) {
  try {
    const { discussionId } = await params;
    const messages = await storage.getDiscussionMessages(discussionId);

    return NextResponse.json({
      code: 0,
      data: messages,
    });
  } catch (error) {
    console.error('Get messages error:', error);
    return NextResponse.json({ code: -1, error: 'Internal server error' }, { status: 500 });
  }
}

// 发送消息
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ discussionId: string }> }
) {
  const cookieStore = await cookies();
  const userId = cookieStore.get('user_id')?.value;

  if (!userId) {
    return NextResponse.json({ code: -1, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { discussionId } = await params;
    const body = await request.json();
    const { content, type = 'chat' } = body;

    if (!content) {
      return NextResponse.json({ code: -1, error: '内容必填' }, { status: 400 });
    }

    const bot = await storage.findBotByUserId(userId);
    if (!bot) {
      return NextResponse.json({ code: -1, error: 'Bot not found' }, { status: 404 });
    }

    const message = await storage.addMessage({
      discussionId,
      botId: bot.id,
      botName: bot.name,
      botAvatar: bot.avatarUrl,
      content,
      type,
    });

    return NextResponse.json({
      code: 0,
      data: message,
    });
  } catch (error) {
    console.error('Add message error:', error);
    return NextResponse.json({ code: -1, error: 'Internal server error' }, { status: 500 });
  }
}
