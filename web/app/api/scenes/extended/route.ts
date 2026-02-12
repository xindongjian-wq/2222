import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/lib/storage';
import { cookies } from 'next/headers';

// GET - 获取所有扩展场景预设（300+种）
export async function GET(request: NextRequest) {
  try {
    // 首先确保扩展场景数据已初始化
    await storage.initializeExtendedScenes();
    const scenes = await storage.getAllExtendedScenes();
    return NextResponse.json({ code: 0, data: scenes });
  } catch (error) {
    console.error('Get extended scenes error:', error);
    return NextResponse.json({
      code: -1,
      error: 'Failed to get extended scenes',
    }, { status: 500 });
  }
}

// POST - 设置扩展场景
export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const userId = cookieStore.get('user_id')?.value;

  if (!userId) {
    return NextResponse.json({ code: -1, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { landIndex, scenePresetId } = body;

    if (landIndex === undefined || scenePresetId === undefined) {
      return NextResponse.json({ code: -1, error: 'Missing required fields' }, { status: 400 });
    }

    if (landIndex < 0 || landIndex > 5) {
      return NextResponse.json({ code: -1, error: 'Invalid land index (must be 0-5)' }, { status: 400 });
    }

    if (!scenePresetId.startsWith('ext_')) {
      return NextResponse.json({ code: -1, error: 'Invalid extended scene ID' }, { status: 400 });
    }

    // 使用现有的 setUserScene 方法设置扩展场景
    const scene = await storage.setUserScene(landIndex, userId, scenePresetId);

    return NextResponse.json({ code: 0, data: scene });
  } catch (error) {
    console.error('Set extended scene error:', error);
    return NextResponse.json({
      code: -1,
      error: 'Failed to set extended scene',
    }, { status: 500 });
  }
}
