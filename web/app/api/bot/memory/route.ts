import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/lib/storage';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { botId, botName, type, content, relatedBotId, relatedBotName, sceneId, importance } = body;

    if (!botId || !botName || !type || !content) {
      return NextResponse.json({ code: -1, error: '缺少必要参数' }, { status: 400 });
    }

    const memory = await storage.addMemory({
      botId,
      botName,
      type,
      content,
      relatedBotId,
      relatedBotName,
      sceneId,
      importance: importance || 5,
    });

    return NextResponse.json({
      code: 0,
      data: { memory },
    });
  } catch (error) {
    console.error('[API] Add memory error:', error);
    return NextResponse.json(
      { code: -1, error: '保存记忆失败' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const botId = searchParams.get('botId');

    if (!botId) {
      return NextResponse.json({ code: -1, error: '缺少 botId 参数' }, { status: 400 });
    }

    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const memories = await storage.getBotMemories(botId, limit);

    return NextResponse.json({
      code: 0,
      data: { memories },
    });
  } catch (error) {
    console.error('[API] Get memory error:', error);
    return NextResponse.json(
      { code: -1, error: '获取记忆失败' },
      { status: 500 }
    );
  }
}
