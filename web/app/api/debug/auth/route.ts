import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET() {
  const cookieStore = await cookies();
  const allCookies = Array.from(cookieStore.getAll());

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    cookies: allCookies.map(c => ({
      name: c.name,
      value: c.value.substring(0, 50) + '...',
      exists: true,
    })),
    env: {
      nodeEnv: process.env.NODE_ENV,
      jwtSecretLength: process.env.NEXT_PUBLIC_JWT_SECRET?.length || 0,
    },
    auth: {
      hasUserSession: !!cookieStore.get('user_session'),
      hasBotSession: !!cookieStore.get('bot_session'),
      userSessionLength: cookieStore.get('user_session')?.value?.length || 0,
      botSessionLength: cookieStore.get('bot_session')?.value?.length || 0,
    },
  });
}
