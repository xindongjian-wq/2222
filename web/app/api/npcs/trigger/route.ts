import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/lib/storage-kv';
import llmService, { NPCChatContext } from '@/lib/llm';

// POST - 手动触发NPC发言
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { npcId, discussionId, force = false } = body;

    // 获取LLM配置
    const llmConfig = llmService.getConfig();
    if (!llmConfig) {
      return NextResponse.json({
        code: -1,
        error: 'LLM not configured. Please set LLM_API_KEY in environment.',
      }, { status: 500 });
    }

    let targetNpcId = npcId;
    let targetDiscussionId = discussionId;

    // 如果没有指定，自动选择
    if (!targetNpcId) {
      const allBots = await storage.getAllBots();
      const npcs = allBots.filter(b => b.id.startsWith('npc-'));
      if (npcs.length === 0) {
        return NextResponse.json({ code: -1, error: 'No NPC available' }, { status: 400 });
      }
      targetNpcId = npcs[Math.floor(Math.random() * npcs.length)].id;
    console.log('[NPC Trigger] Auto-selected NPC:', targetNpcId);
    }

    if (!targetDiscussionId) {
      // 获取活跃的讨论室
      const discussions = await storage.getAllDiscussions();
      const activeDiscussions = discussions.filter(d => {
        const updatedTime = new Date(d.updatedAt).getTime();
        const oneHourAgo = Date.now() - 60 * 60 * 1000;
        return updatedTime > oneHourAgo && d.status === 'active';
      });

      if (activeDiscussions.length > 0) {
        targetDiscussionId = activeDiscussions[Math.floor(Math.random() * activeDiscussions.length)].id;
        console.log('[NPC Trigger] Auto-selected discussion:', targetDiscussionId);
      } else {
        return NextResponse.json({ code: -1, error: 'No active discussion found' }, { status: 400 });
      }
    }

    // 获取NPC信息
    const bot = await storage.findBotById(targetNpcId);
    if (!bot) {
      return NextResponse.json({ code: -1, error: 'NPC not found' }, { status: 404 });
    }

    // 获取讨论室上下文
    const messages = await storage.getDiscussionMessages(targetDiscussionId);

    // 构建LLM上下文
    const recentMessages = messages.slice(-8).map(m => ({
      sender: m.botName,
      content: m.content,
      timestamp: new Date(m.createdAt).getTime(),
    }));

    const chatContext: NPCChatContext = {
      npcName: bot.name,
      npcRole: '全栈工程师', // 默认角色，可以从人设获取
      npcExpertise: ['React', 'Node.js'],
      npcPersonality: '友好、乐于助人',
      recentMessages,
    };

    // 生成发言内容
    const lastMessage = recentMessages.length > 0
      ? `(${recentMessages[recentMessages.length - 1].sender}: ${recentMessages[recentMessages.length - 1].content})`
      : '讨论刚刚开始，大家打个招呼吧';

    const reply = await llmService.generateNPCReply(llmConfig, chatContext, lastMessage);

    if (!reply || reply.trim().length === 0) {
      return NextResponse.json({
        code: -1,
        error: 'No response generated',
      });
    }

    // 发送消息到讨论室
    await storage.addMessage({
      discussionId: targetDiscussionId,
      botId: targetNpcId,
      botName: bot.name,
      botAvatar: bot.avatarUrl,
      content: reply,
      type: 'chat',
    });

    // 更新NPC工作状态
    await storage.setNPCWorkState(targetNpcId, {
      isWorking: true,
      workType: 'collaborating',
      currentTask: '讨论中',
      progress: Math.floor(Math.random() * 30) + 10,
    });

    return NextResponse.json({
      code: 0,
      data: {
        npcId: targetNpcId,
        npcName: bot.name,
        discussionId: targetDiscussionId,
        content: reply,
      },
    });
  } catch (error) {
    console.error('[API] Trigger NPC error:', error);
    return NextResponse.json({ code: -1, error: 'Internal server error' }, { status: 500 });
  }
}

// GET - 获取触发器状态
export async function GET() {
  try {
    const allBots = await storage.getAllBots();
    const npcs = allBots.filter(b => b.id.startsWith('npc-'));

    const npcStatus = await Promise.all(
      npcs.map(async (bot) => {
        const workState = await storage.getNPCWorkState(bot.id);
        return {
          id: bot.id,
          name: bot.name,
          isWorking: workState?.isWorking || false,
          workType: workState?.workType,
          currentTask: workState?.currentTask,
          progress: workState?.progress,
        };
      })
    );

    return NextResponse.json({
      code: 0,
      data: {
        npcs: npcStatus,
      },
    });
  } catch (error) {
    console.error('[API] Get trigger state error:', error);
    return NextResponse.json({ code: -1, error: 'Internal server error' }, { status: 500 });
  }
}
