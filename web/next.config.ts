import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_SECONDME_CLIENT_ID: process.env.NEXT_PUBLIC_SECONDME_CLIENT_ID || '',
    NEXT_PUBLIC_SECONDME_REDIRECT_URI: process.env.NEXT_PUBLIC_SECONDME_REDIRECT_URI || '',
    NEXT_PUBLIC_SECONDME_OAUTH_URL: process.env.NEXT_PUBLIC_SECONDME_OAUTH_URL || 'https://go.second.me/oauth/',
  },
};

export default nextConfig;
