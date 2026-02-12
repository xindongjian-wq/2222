import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/lib/storage-cookie';
import { cookies } from 'next/headers';

// GET - 获取所有场景预设
export async function GET(request: NextRequest) {
  try {
    const scenes = await storage.getAllScenePresets();
    return NextResponse.json({ code: 0, data: scenes });
  } catch (error) {
    console.error('Get scenes error:', error);
    return NextResponse.json({
      code: -1,
      error: 'Failed to get scenes',
    }, { status: 500 });
  }
}

// POST - 为用户的某块地设置场景
export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const userId = cookieStore.get('user_id')?.value;

  if (!userId) {
    return NextResponse.json({ code: -1, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { landIndex, scenePresetId, sceneData } = body;

    if (landIndex === undefined || scenePresetId === undefined) {
      return NextResponse.json({ code: -1, error: 'Missing required fields' }, { status: 400 });
    }

    if (landIndex < 0 || landIndex > 5) {
      return NextResponse.json({ code: -1, error: 'Invalid land index (must be 0-5)' }, { status: 400 });
    }

    // 如果是AI推荐场景（以ai_rec_开头），需要先创建动态场景
    let finalScenePresetId = scenePresetId;

    if (scenePresetId.startsWith('ai_rec_') && sceneData) {
      // 创建动态场景到扩展场景文件
      const dynamicScene = await storage.createDynamicScene({
        ...sceneData,
        id: scenePresetId,
      });
      finalScenePresetId = dynamicScene.id;
    }

    const scene = await storage.setUserScene(landIndex, userId, finalScenePresetId);

    return NextResponse.json({ code: 0, data: scene });
  } catch (error) {
    console.error('Set scene error:', error);
    return NextResponse.json({
      code: -1,
      error: 'Failed to set scene',
    }, { status: 500 });
  }
}
