import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/lib/storage-kv';

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
    console.error('[API] Get memories error:', error);
    return NextResponse.json(
      { code: -1, error: '获取记忆失败' },
      { status: 500 }
    );
  }
}
