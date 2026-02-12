import { NextRequest, NextResponse } from 'next/server';
import { exchangeCodeForToken, getUserInfo } from '@/lib/secondme';
import { storage } from '@/lib/storage';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  if (error) {
    return NextResponse.redirect(new URL('/?error=' + encodeURIComponent(error), request.url));
  }

  if (!code) {
    return NextResponse.redirect(new URL('/?error=no_code', request.url));
  }

  try {
    // 用授权码换取访问令牌
    const tokenResponse = await exchangeCodeForToken(code);

    if (tokenResponse.code !== 0) {
      console.error('Token exchange failed with code:', tokenResponse.code);
      return NextResponse.redirect(new URL('/?error=token_exchange_failed', request.url));
    }

    const { accessToken, refreshToken, expiresIn } = tokenResponse.data;

    // 获取用户信息
    const userInfoResponse = await getUserInfo(accessToken);

    if (userInfoResponse.code !== 0) {
      return NextResponse.redirect(new URL('/?error=get_user_info_failed', request.url));
    }

    const userInfo = userInfoResponse.data;

    // 计算令牌过期时间
    const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();

    // 查找或创建用户
    let user = await storage.findUserBySecondMeId(userInfo.id);

    if (user) {
      // 更新现有用户的令牌
      user = await storage.updateUser(user.id, {
        email: userInfo.email,
        name: userInfo.name,
        avatarUrl: userInfo.avatarUrl,
        accessToken,
        refreshToken,
        tokenExpiresAt: expiresAt,
      });
    } else {
      // 创建新用户
      user = await storage.createUser({
        secondMeId: userInfo.id,
        email: userInfo.email,
        name: userInfo.name,
        avatarUrl: userInfo.avatarUrl,
        accessToken,
        refreshToken,
        tokenExpiresAt: expiresAt,
      });
    }

    // 确保用户创建成功
    if (!user) {
      return NextResponse.redirect(new URL('/?error=user_creation_failed', request.url));
    }

    // 设置会话 cookie
    const cookieStore = await cookies();
    cookieStore.set('user_id', user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 天
    });

    // 重定向到主页
    return NextResponse.redirect(new URL('/', request.url));

  } catch (error) {
    console.error('OAuth callback error:', error);
    return NextResponse.redirect(new URL('/?error=server_error', request.url));
  }
}
