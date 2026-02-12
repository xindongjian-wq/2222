import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/lib/storage';
import { cookies } from 'next/headers';

// 获取或创建讨论室
export async function GET(request: NextRequest) {
  const cookieStore = await cookies();
  const userId = cookieStore.get('user_id')?.value;

  if (!userId) {
    return NextResponse.json({ code: -1, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const searchParams = request.nextUrl.searchParams;
    const teamId = searchParams.get('teamId');

    if (!teamId) {
      return NextResponse.json({ code: -1, error: 'teamId required' }, { status: 400 });
    }

    // 查找或创建讨论室
    let discussion = await storage.findDiscussionByTeam(teamId);

    if (!discussion) {
      discussion = await storage.createDiscussion({ teamId });
    }

    return NextResponse.json({
      code: 0,
      data: discussion,
    });
  } catch (error) {
    console.error('Get discussion error:', error);
    return NextResponse.json({ code: -1, error: 'Internal server error' }, { status: 500 });
  }
}
