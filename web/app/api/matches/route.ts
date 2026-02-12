import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/lib/storage';

// 获取所有比赛
export async function GET(request: NextRequest) {
  try {
    const matches = await storage.getAllMatches();
    // 按创建时间倒序排列
    const sorted = matches.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return NextResponse.json({
      code: 0,
      data: sorted,
    });
  } catch (error) {
    console.error('Get matches error:', error);
    return NextResponse.json({ code: -1, error: 'Internal server error' }, { status: 500 });
  }
}

// 创建新比赛（管理员功能，暂时开放）
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { theme, startTime } = body;

    if (!theme || !startTime) {
      return NextResponse.json({ code: -1, error: '主题和开始时间必填' }, { status: 400 });
    }

    const match = await storage.createMatch({
      theme,
      status: 'upcoming',
      startTime: new Date(startTime).toISOString(),
      teams: [],
    });

    return NextResponse.json({
      code: 0,
      data: match,
    });
  } catch (error) {
    console.error('Create match error:', error);
    return NextResponse.json({ code: -1, error: 'Internal server error' }, { status: 500 });
  }
}
