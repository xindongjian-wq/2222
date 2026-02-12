import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/lib/storage';

// GET - 获取用户的场景配置
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    const scenes = await storage.getUserScenes(userId);
    return NextResponse.json({ code: 0, data: scenes });
  } catch (error) {
    console.error('Get user scenes error:', error);
    return NextResponse.json({
      code: -1,
      error: 'Failed to get user scenes',
    }, { status: 500 });
  }
}
