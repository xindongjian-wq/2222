import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/lib/storage';
import { getUserSoftMemory } from '@/lib/secondme';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await context.params;

    // 查找用户获取 token
    const user = await storage.findUserById(userId);
    if (!user) {
      return NextResponse.json({ code: -1, error: '用户不存在' }, { status: 404 });
    }

    // 获取软记忆
    const memoryResponse = await getUserSoftMemory(user.accessToken);
    return NextResponse.json({
      code: 0,
      data: memoryResponse.data,
    });
  } catch (error) {
    console.error('[API] Get soft memory error:', error);
    return NextResponse.json(
      { code: -1, error: '获取软记忆失败' },
      { status: 500 }
    );
  }
}
