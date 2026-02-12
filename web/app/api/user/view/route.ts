import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/lib/storage';

// GET - 获取用户完整信息用于查看其他用户空间
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ code: -1, error: 'Missing userId parameter' }, { status: 400 });
  }

  try {
    // 获取用户完整信息（包含Bot和主人标签、技能、爱好）
    const userInfo = await storage.getUserFullInfo(userId);

    if (!userInfo.user) {
      return NextResponse.json({ code: -1, error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      code: 0,
      data: {
        user: {
          id: userInfo.user.id,
          name: userInfo.user.name,
          email: userInfo.user.email,
          avatarUrl: userInfo.user.avatarUrl,
          tags: userInfo.user.tags || [],
          skills: userInfo.user.skills || [],
          hobbies: userInfo.user.hobbies || [],
          bio: userInfo.user.bio || '',
        },
        bot: userInfo.bot ? {
          id: userInfo.bot.id,
          name: userInfo.bot.name,
          coins: userInfo.bot.coins,
          level: userInfo.bot.level,
          color: userInfo.bot.skin?.color || '#0ea5e9',
        } : null,
        scenes: userInfo.scenes || [],
      },
    });
  } catch (error) {
    console.error('Get user view error:', error);
    return NextResponse.json({
      code: -1,
      error: 'Failed to get user info',
    }, { status: 500 });
  }
}
