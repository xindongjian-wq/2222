import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.NEXT_PUBLIC_JWT_SECRET || 'demo-secret-key-change-in-production'
);

export async function GET(request: NextRequest) {
  const cookieStore = await cookies();
  const userSession = cookieStore.get('user_session')?.value;
  const botSession = cookieStore.get('bot_session')?.value;

  console.log('[User API] user_session exists:', !!userSession);
  console.log('[User API] bot_session exists:', !!botSession);

  if (!userSession) {
    console.log('[User API] No user_session cookie found');
    return NextResponse.json({ code: -1, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Decode JWT to get user data
    const { payload } = await jwtVerify(userSession, JWT_SECRET);
    const user = payload as any;

    console.log('[User API] Decoded user:', user.id, user.name);

    if (!user) {
      return NextResponse.json({ code: -1, error: 'Invalid session' }, { status: 401 });
    }

    // Decode bot session if exists
    let bot = null;
    if (botSession) {
      try {
        const botPayload = await jwtVerify(botSession, JWT_SECRET);
        bot = botPayload.payload as any;
        console.log('[User API] Decoded bot:', bot.id);
      } catch (e) {
        console.log('[User API] Failed to decode bot session:', e);
      }
    }

    // 如果没有 bot，创建默认的
    if (!bot) {
      bot = {
        id: `bot_${user.secondMeId}`,
        userId: user.id,
        secondMeId: user.secondMeId,
        name: user.name || 'AI 参赛者',
        avatarUrl: user.avatarUrl,
        skin: { color: '#0ea5e9', style: 'default', accessories: [] },
        level: 1,
        xp: 0,
        coins: 10000,
        titles: [],
        currentScene: 'plaza',
        mood: 'happy',
        status: 'idle',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }

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
    console.error('[User API] Error:', error);
    return NextResponse.json({
      code: -1,
      error: 'Session verification failed',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 401 });
  }
}
