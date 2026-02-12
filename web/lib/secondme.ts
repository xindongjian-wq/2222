const BASE_URL = process.env.SECONDME_BASE_URL || 'https://app.mindos.com/gate/lab';
const CLIENT_ID = process.env.NEXT_PUBLIC_SECONDME_CLIENT_ID || '';
const CLIENT_SECRET = process.env.NEXT_PUBLIC_SECONDME_CLIENT_SECRET || '';
const REDIRECT_URI = process.env.NEXT_PUBLIC_SECONDME_REDIRECT_URI || '';

export interface SecondMeTokenResponse {
  code: number;
  data: {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  };
}

export interface SecondMeUserInfo {
  id: string;
  email?: string;
  name?: string;
  avatarUrl?: string;
  route?: string;
}

export interface SecondMeResponse<T = any> {
  code: number;
  data: T;
}

/**
 * 用授权码换取访问令牌
 */
export async function exchangeCodeForToken(code: string): Promise<SecondMeTokenResponse> {
  const url = `${BASE_URL}/api/oauth/token/code`;
  console.log('[OAuth] Token exchange URL:', url);
  console.log('[OAuth] Client ID:', CLIENT_ID);
  console.log('[OAuth] Redirect URI:', REDIRECT_URI);

  // 必须使用 application/x-www-form-urlencoded 格式
  const params = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: REDIRECT_URI,
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
  });

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });

  console.log('[OAuth] Response status:', response.status, response.statusText);

  if (!response.ok) {
    const text = await response.text();
    console.error('[OAuth] Error response:', text);
    throw new Error(`Token exchange failed: ${response.statusText} - ${text}`);
  }

  return response.json();
}

/**
 * 获取用户信息
 */
export async function getUserInfo(accessToken: string): Promise<SecondMeResponse<SecondMeUserInfo>> {
  const response = await fetch(`${BASE_URL}/api/secondme/user/info`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Get user info failed: ${response.statusText}`);
  }

  return response.json();
}

/**
 * 获取用户兴趣标签
 */
export async function getUserShades(accessToken: string): Promise<SecondMeResponse<{ shades: string[] }>> {
  const response = await fetch(`${BASE_URL}/api/secondme/user/shades`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Get user shades failed: ${response.statusText}`);
  }

  return response.json();
}

/**
 * 获取用户软记忆
 */
export async function getUserSoftMemory(accessToken: string): Promise<SecondMeResponse<{ list: any[] }>> {
  const response = await fetch(`${BASE_URL}/api/secondme/user/softmemory`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Get user soft memory failed: ${response.statusText}`);
  }

  return response.json();
}
