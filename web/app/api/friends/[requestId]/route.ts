import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/lib/storage';
import { cookies } from 'next/headers';

// PUT - 接受好友申请
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ requestId: string }> }
) {
  const cookieStore = await cookies();
  const userId = cookieStore.get('user_id')?.value;

  if (!userId) {
    return NextResponse.json({ code: -1, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { requestId } = await params;

    const friend = await storage.acceptFriendRequest(requestId);
    if (friend) {
      return NextResponse.json({ code: 0, data: friend });
    }

    return NextResponse.json({ code: -1, error: 'Request not found' }, { status: 404 });
  } catch (error) {
    console.error('Accept friend request error:', error);
    return NextResponse.json({
      code: -1,
      error: 'Failed to accept friend request',
    }, { status: 500 });
  }
}

// DELETE - 拒绝好友申请
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ requestId: string }> }
) {
  const cookieStore = await cookies();
  const userId = cookieStore.get('user_id')?.value;

  if (!userId) {
    return NextResponse.json({ code: -1, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { requestId } = await params;

    const success = await storage.rejectFriendRequest(requestId);
    if (success) {
      return NextResponse.json({ code: 0, message: 'Friend request rejected' });
    }

    return NextResponse.json({ code: -1, error: 'Request not found' }, { status: 404 });
  } catch (error) {
    console.error('Reject friend request error:', error);
    return NextResponse.json({
      code: -1,
      error: 'Failed to reject friend request',
    }, { status: 500 });
  }
}
