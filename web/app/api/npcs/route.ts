import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/lib/storage-cookie';
import { NPC_PERSONAS } from '@/data/npc-personas';

// GET - 获取NPC列表
export async function GET() {
  try {
    const allBots = await storage.getAllBots();
    const npcs = allBots.filter(b => b.id.startsWith('npc-'));

    // 附加人设信息
    const npcsWithPersona = npcs.map(bot => {
      const persona = NPC_PERSONAS.find(p => p.id === bot.id);
      return {
        ...bot,
        persona,
      };
    });

    return NextResponse.json({
      code: 0,
      data: { npcs: npcsWithPersona },
    });
  } catch (error) {
    console.error('[API] Get NPCs error:', error);
    return NextResponse.json(
      { code: -1, error: '获取 NPC 失败' },
      { status: 500 }
    );
  }
}
