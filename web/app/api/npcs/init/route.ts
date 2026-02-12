import { NextResponse } from 'next/server';
import { storage } from '@/lib/storage-cookie';
import { NPC_PERSONAS } from '@/data/npc-personas';

export async function POST() {
  try {
    // 检查是否已初始化
    const existingBots = await storage.getAllBots();
    const npcCount = existingBots.filter(b => b.id.startsWith('npc-')).length;

    if (npcCount >= 10) {
      return NextResponse.json({
        code: 0,
        data: { message: 'NPCs already initialized', count: npcCount },
      });
    }

    // 创建 10 个 NPC
    const createdNPCs = [];
    for (const persona of NPC_PERSONAS) {
      // 检查是否已存在
      const exists = existingBots.find(b => b.id === persona.id);
      if (exists) {
        createdNPCs.push(exists);
        continue;
      }

      const bot = await storage.createBot({
        id: persona.id,
        userId: 'system', // 系统 NPC
        secondMeId: 'system',
        name: persona.name,
        skin: {
          color: persona.color,
          style: 'default',
          accessories: [],
        },
        level: Math.floor(Math.random() * 10) + 1,
      });

      createdNPCs.push(bot);
    }

    return NextResponse.json({
      code: 0,
      data: {
        message: 'NPCs initialized successfully',
        count: createdNPCs.length,
        npcs: createdNPCs,
      },
    });
  } catch (error) {
    console.error('[API] Init NPCs error:', error);
    return NextResponse.json(
      { code: -1, error: '初始化 NPC 失败' },
      { status: 500 }
    );
  }
}

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
