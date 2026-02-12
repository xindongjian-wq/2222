import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/lib/storage';

export async function GET(request: NextRequest) {
  try {
    const currentMatch = await storage.findCurrentMatch();
    return NextResponse.json({
      code: 0,
      data: currentMatch,
    });
  } catch (error) {
    console.error('Get current match error:', error);
    return NextResponse.json({ code: -1, error: 'Internal server error' }, { status: 500 });
  }
}
