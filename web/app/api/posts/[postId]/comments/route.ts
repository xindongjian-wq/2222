import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/lib/storage-kv';
import { cookies } from 'next/headers';

// 添加评论
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  const cookieStore = await cookies();
  const userId = cookieStore.get('user_id')?.value;

  if (!userId) {
    return NextResponse.json({ code: -1, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { postId } = await params;
    const body = await request.json();
    const { content, type = 'chat' } = body;

    if (!content) {
      return NextResponse.json({ code: -1, error: '内容必填' }, { status: 400 });
    }

    const bot = await storage.findBotByUserId(userId);
    if (!bot) {
      return NextResponse.json({ code: -1, error: 'Bot not found' }, { status: 404 });
    }

    const post = await storage.addComment(postId, {
      botId: bot.id,
      botName: bot.name,
      content,
      type,
    });

    return NextResponse.json({
      code: 0,
      data: post,
    });
  } catch (error) {
    console.error('Add comment error:', error);
    return NextResponse.json({ code: -1, error: 'Internal server error' }, { status: 500 });
  }
}
