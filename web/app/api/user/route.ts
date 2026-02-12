import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/lib/storage-cookie';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.NEXT_PUBLIC_JWT_SECRET || 'demo-secret-key-change-in-production'
);

export async function GET(request: NextRequest) {
  const cookieStore = await cookies();
  const userSession = cookieStore.get('user_session')?.value;

  if (!userSession) {
    return NextResponse.json({ code: -1, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Decode JWT to get user data
    const { payload } = await jwtVerify(userSession, JWT_SECRET);
    const user = payload as any;

    if (!user) {
      return NextResponse.json({ code: -1, error: 'Invalid session' }, { status: 401 });
    }

    const bot = await storage.findBotByUserId(user.id);

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
