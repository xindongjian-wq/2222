import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    redirectUri: process.env.NEXT_PUBLIC_SECONDME_REDIRECT_URI,
    oauthUrl: process.env.NEXT_PUBLIC_SECONDME_OAUTH_URL,
    clientId: process.env.NEXT_PUBLIC_SECONDME_CLIENT_ID?.substring(0, 10) + '...',
  });
}
