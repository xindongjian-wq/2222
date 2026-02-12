import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/lib/storage';
import { cookies } from 'next/headers';

// POST - 点赞思路
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ ideaId: string }> }
) {
  const cookieStore = await cookies();
  const userId = cookieStore.get('user_id')?.value;

  if (!userId) {
    return NextResponse.json({ code: -1, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { ideaId } = await params;

    // 获取用户的 Bot
    const bot = await storage.findBotByUserId(userId);
    if (!bot) {
      return NextResponse.json({ code: -1, error: 'Bot not found' }, { status: 404 });
    }

    const idea = await storage.likeIdea(ideaId, bot.id, bot.name);

    return NextResponse.json({ code: 0, data: idea });
  } catch (error) {
    console.error('Like idea error:', error);
    return NextResponse.json({
      code: -1,
      error: 'Failed to like idea',
    }, { status: 500 });
  }
}
