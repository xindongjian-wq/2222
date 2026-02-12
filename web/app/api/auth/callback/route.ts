import { NextRequest, NextResponse } from 'next/server';
import { exchangeCodeForToken, getUserInfo } from '@/lib/secondme';
import { SignJWT } from 'jose';
import { cookies } from 'next/headers';

const JWT_SECRET = new TextEncoder().encode(
  process.env.NEXT_PUBLIC_JWT_SECRET || 'demo-secret-key-change-in-production'
);

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  console.log('[Callback] Received params:', { code: code?.substring(0, 20) + '...', error });

  if (error) {
    console.error('[Callback] OAuth error:', error);
    return NextResponse.redirect(new URL('/?error=' + encodeURIComponent(error), request.url));
  }

  if (!code) {
    console.error('[Callback] No code in request');
    return NextResponse.redirect(new URL('/?error=no_code', request.url));
  }

  try {
    console.log('[Callback] Starting token exchange...');
    // 用授权码换取访问令牌
    const tokenResponse = await exchangeCodeForToken(code);
    console.log('[Callback] Token response:', JSON.stringify(tokenResponse));

    if (tokenResponse.code !== 0) {
      console.error('[Callback] Token exchange failed with code:', tokenResponse.code);
      return NextResponse.redirect(new URL('/?error=token_exchange_failed', request.url));
    }

    const { accessToken, refreshToken, expiresIn } = tokenResponse.data;
    console.log('[Callback] Got access token');

    // 获取用户信息
    const userInfoResponse = await getUserInfo(accessToken);

    if (userInfoResponse.code !== 0) {
      console.error('[Callback] Get user info failed:', userInfoResponse);
      return NextResponse.redirect(new URL('/?error=get_user_info_failed', request.url));
    }

    const userInfo = userInfoResponse.data;
    console.log('[Callback] User info:', JSON.stringify(userInfo));

    // 计算令牌过期时间
    const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();

    // 生成用户 ID
    const userId = `user_${userInfo.id}_${Date.now()}`;
    const botId = `bot_${userInfo.id}_${Date.now()}`;

    // 创建用户数据
    const userData = {
      id: userId,
      secondMeId: userInfo.id,
      email: userInfo.email,
      name: userInfo.name,
      avatarUrl: userInfo.avatarUrl,
      accessToken,
      refreshToken,
      tokenExpiresAt: expiresAt,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // 创建 Bot 数据
    const botData = {
      id: botId,
      userId: userId,
      secondMeId: userInfo.id,
      name: userInfo.name || 'AI 参赛者',
      avatarUrl: userInfo.avatarUrl,
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

    // 创建 JWT tokens
    const userToken = await new SignJWT(userData)
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('30d')
      .sign(JWT_SECRET);

    const botToken = await new SignJWT(botData)
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('30d')
      .sign(JWT_SECRET);

    console.log('[Callback] Created JWT tokens, setting cookies...');

    // 设置 cookies
    const cookieStore = await cookies();
    cookieStore.set('user_session', userToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30,
      path: '/',
    });
    cookieStore.set('bot_session', botToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30,
      path: '/',
    });

    console.log('[Callback] Redirecting to arena with cookies set');
    return NextResponse.redirect(new URL('/arena', request.url));

  } catch (error) {
    console.error('OAuth callback error:', error);
    return NextResponse.redirect(new URL('/?error=server_error', request.url));
  }
}
