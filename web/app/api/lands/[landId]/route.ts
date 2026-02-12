import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/lib/storage-cookie';
import { cookies } from 'next/headers';

// GET - 获取单个土地详情
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ landId: string }> }
) {
  try {
    const { landId } = await params;
    const land = await storage.findLandById(landId);

    if (!land) {
      return NextResponse.json({ code: -1, error: 'Land not found' }, { status: 404 });
    }

    return NextResponse.json({ code: 0, data: land });
  } catch (error) {
    console.error('Get land error:', error);
    return NextResponse.json({
      code: -1,
      error: 'Failed to get land',
    }, { status: 500 });
  }
}

// PATCH - 更新土地信息
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ landId: string }> }
) {
  const cookieStore = await cookies();
  const userId = cookieStore.get('user_id')?.value;

  if (!userId) {
    return NextResponse.json({ code: -1, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { landId } = await params;
    const body = await request.json();

    // 检查土地所有权
    const existingLand = await storage.findLandById(landId);
    if (!existingLand) {
      return NextResponse.json({ code: -1, error: 'Land not found' }, { status: 404 });
    }

    if (existingLand.userId !== userId) {
      return NextResponse.json({ code: -1, error: 'Forbidden' }, { status: 403 });
    }

    const land = await storage.updateLand(landId, body);

    return NextResponse.json({ code: 0, data: land });
  } catch (error) {
    console.error('Update land error:', error);
    return NextResponse.json({
      code: -1,
      error: 'Failed to update land',
    }, { status: 500 });
  }
}

// DELETE - 删除土地
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ landId: string }> }
) {
  const cookieStore = await cookies();
  const userId = cookieStore.get('user_id')?.value;

  if (!userId) {
    return NextResponse.json({ code: -1, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { landId } = await params;

    // 检查土地所有权
    const existingLand = await storage.findLandById(landId);
    if (!existingLand) {
      return NextResponse.json({ code: -1, error: 'Land not found' }, { status: 404 });
    }

    if (existingLand.userId !== userId) {
      return NextResponse.json({ code: -1, error: 'Forbidden' }, { status: 403 });
    }

    await storage.deleteLand(landId);

    return NextResponse.json({ code: 0, message: 'Land deleted' });
  } catch (error) {
    console.error('Delete land error:', error);
    return NextResponse.json({
      code: -1,
      error: 'Failed to delete land',
    }, { status: 500 });
  }
}
