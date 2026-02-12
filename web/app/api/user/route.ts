import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/lib/storage-kv';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  const cookieStore = await cookies();
  const userId = cookieStore.get('user_id')?.value;

  if (!userId) {
    return NextResponse.json({ code: -1, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const user = await storage.findUserById(userId);
    if (!user) {
      return NextResponse.json({ code: -1, error: 'User not found' }, { status: 404 });
    }

    const bot = await storage.findBotByUserId(userId);

    return NextResponse.json({
      code: 0,
      data: {
        user: {
          id: user.secondMeId,
          name: user.name,
          email: user.email,
          avatarUrl: user.avatarUrl,
        },
        bot: bot ? {
          id: bot.id,
          name: bot.name,
          avatarUrl: bot.avatarUrl,
          skin: bot.skin,
          level: bot.level,
          xp: bot.xp,
          coins: bot.coins,
          titles: bot.titles,
          currentScene: bot.currentScene,
          mood: bot.mood,
          status: bot.status,
        } : null,
      },
    });
  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json({
      code: -1,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
