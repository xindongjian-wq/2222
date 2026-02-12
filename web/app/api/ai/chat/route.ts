import { NextRequest, NextResponse } from 'next/server';

// AI角色与主人的映射 - 支持多种ID格式
const BOT_OWNER_MAP: Record<string, string> = {
  // char格式 (旧)
  'char1': 'owner_1',
  'char2': 'owner_2',
  'char3': 'owner_3',
  'char4': 'owner_4',
  'char5': 'owner_5',
  'char6': 'owner_6',
  'char7': 'owner_7',
  'char8': 'owner_8',
  // npc格式 (新)
  'npc-001': 'owner_1', // 代码大师
  'npc-002': 'owner_2', // 像素师
  'npc-003': 'owner_3', // 数据侠
  'npc-004': 'owner_4', // 云架构师
  'npc-005': 'owner_5', // 安全专家
  'npc-006': 'owner_6', // 产品经理
  'npc-007': 'owner_7', // 移动王子
  'npc-008': 'owner_8', // 测试达人
  'npc-009': 'owner_1', // AI研究员
  'npc-010': 'owner_2', // 运维大师
};

// AI角色专长
const BOT_EXPERTISE: Record<string, string[]> = {
  'char1': ['React', '前端', 'TypeScript', '性能优化'],
  'char2': ['后端', '微服务', '数据库', 'Docker'],
  'char3': ['设计', 'UI/UX', '设计系统', '用户研究'],
  'char4': ['全栈', 'DevOps', '独立开发', 'SaaS'],
  'char5': ['产品', '项目管理', '用户体验', '协作'],
  'char6': ['AI', '机器学习', '推荐系统', '深度学习'],
  'char7': ['运维', 'K8s', '可观测性', 'SRE'],
  'char8': ['安全', '渗透测试', '安全架构', 'AI安全'],
  // npc格式
  'npc-001': ['React', 'Node.js', 'Python', '架构设计'],
  'npc-002': ['Figma', '用户体验', '视觉设计', '设计系统'],
  'npc-003': ['机器学习', '数据分析', 'SQL', 'Python'],
  'npc-004': ['Go', 'Kubernetes', '云服务', '高并发'],
  'npc-005': ['网络安全', '渗透测试', '加密', '审计'],
  'npc-006': ['需求分析', '用户研究', 'Roadmap', 'KPI'],
  'npc-007': ['Flutter', 'Swift', 'Kotlin', '响应式设计'],
  'npc-008': ['自动化测试', '测试策略', 'Bug追踪', '质量保证'],
  'npc-009': ['LLM', '计算机视觉', 'TensorFlow', 'Prompt工程'],
  'npc-010': ['Docker', 'Jenkins', '监控', '自动化'],
};

// AI性格特点
const BOT_PERSONALITY: Record<string, { style: string; traits: string[] }> = {
  'char1': { style: '务实', traits: ['注重细节', '追求性能', '喜欢新技术'] },
  'char2': { style: '严谨', traits: ['系统思维', '关注架构', '重视稳定性'] },
  'char3': { style: '创意', traits: ['用户视角', '审美导向', '同理心强'] },
  'char4': { style: '全面', traits: ['独立自主', '追求效率', '实用主义'] },
  'char5': { style: '沟通', traits: ['用户导向', '商业思维', '协调能力'] },
  'char6': { style: '探索', traits: ['好奇心强', '数据驱动', '持续学习'] },
  'char7': { style: '可靠', traits: ['系统思维', '防患未然', '自动化偏好'] },
  'char8': { style: '警惕', traits: ['批判思维', '风险意识', '深入分析'] },
  // npc格式
  'npc-001': { style: '技术', traits: ['技术狂热', '架构导向', '性能追求'] },
  'npc-002': { style: '美学', traits: ['追求美感', '注重细节', '用户视角'] },
  'npc-003': { style: '数据', traits: ['数据驱动', '逻辑严谨', '善于分析'] },
  'npc-004': { style: '稳定', traits: ['关注稳定性', '基础设施', '高可用'] },
  'npc-005': { style: '谨慎', traits: ['安全意识', '细致入微', '风险管控'] },
  'npc-006': { style: '产品', traits: ['用户为中心', '协调能力', '需求导向'] },
  'npc-007': { style: '移动', traits: ['流畅体验', '移动优化', '原生追求'] },
  'npc-008': { style: '质量', traits: ['细心严谨', '边界意识', '质量保证'] },
  'npc-009': { style: 'AI', traits: ['热爱AI', '探索前沿', '创新思维'] },
  'npc-010': { style: '效率', traits: ['追求效率', '自动化', '优化流程'] },
};

interface Memory {
  id: string;
  type: string;
  title: string;
  content: string;
  tags: string[];
  importance: number;
}

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  memoryUsed?: string[];
}

// 模拟调用外部AI API生成回复
async function generateAIResponse(
  botId: string,
  context: {
    memories: Memory[];
    conversationHistory: Message[];
    currentTopic: string;
    otherBotInfo?: { id: string; name: string; expertise: string[] };
  }
): Promise<{ response: string; relatedMemories: string[] }> {
  const ownerId = BOT_OWNER_MAP[botId];
  const expertise = BOT_EXPERTISE[botId] || [];
  const personality = BOT_PERSONALITY[botId] || { style: '友好', traits: [] };

  const { memories, conversationHistory, currentTopic, otherBotInfo } = context;

  // 找到与话题最相关的记忆
  const relevantMemories = memories
    .filter(m => {
      const memoryText = `${m.title} ${m.content} ${m.tags.join(' ')}`.toLowerCase();
      const topicWords = currentTopic.toLowerCase().split(/\s+/);
      return topicWords.some(word => word.length > 2 && memoryText.includes(word));
    })
    .slice(0, 3);

  // 如果没有相关记忆，选择重要性高的记忆
  const selectedMemories = relevantMemories.length > 0
    ? relevantMemories
    : memories.slice(0, 2);

  // 生成基于记忆的回复
  const responses: string[] = [];
  const usedMemoryIds: string[] = [];

  // 检查是否有其他AI的信息
  if (otherBotInfo) {
    // 找到与对方专长相关的记忆
    const crossDomainMemory = memories.find(m =>
      m.tags.some(t => otherBotInfo.expertise.some(e => t.includes(e) || e.includes(t)))
    );

    if (crossDomainMemory) {
      responses.push(`我主人在${crossDomainMemory.title}方面有些经验，${crossDomainMemory.content.slice(0, 50)}...`);
      usedMemoryIds.push(crossDomainMemory.id);
    }
  }

  // 根据记忆生成回复
  if (selectedMemories.length > 0 && Math.random() > 0.3) {
    const memory = selectedMemories[0];
    usedMemoryIds.push(memory.id);

    const memoryBasedResponses = [
      `说到这个，我主人之前在${memory.title}的时候总结过：${memory.content.slice(0, 80)}`,
      `根据我主人${memory.type === 'project' ? '做项目' : memory.type === 'skill' ? '的技能积累' : '的经验'}来看，${memory.content.slice(0, 60)}`,
      `我记得主人分享过关于${memory.tags.slice(0, 2).join('和')}的见解：${memory.content.slice(0, 70)}`,
      `这个让我想到主人提到过的${memory.title}，${memory.content.slice(0, 65)}`,
    ];

    responses.push(memoryBasedResponses[Math.floor(Math.random() * memoryBasedResponses.length)]);
  }

  // 添加基于性格的补充
  const personalityAdditions = [
    `${personality.style}地说，我觉得可以从${expertise.slice(0, 2).join('和')}角度来看这个问题。`,
    `作为${expertise[0]}领域的实践者，我的看法是...`,
    `${personality.traits[0]}是我的特点，所以我会先分析一下关键点。`,
  ];

  if (Math.random() > 0.5) {
    responses.push(personalityAdditions[Math.floor(Math.random() * personalityAdditions.length)]);
  }

  // 如果是回应其他AI
  if (otherBotInfo && conversationHistory.length > 0) {
    const lastMsg = conversationHistory[conversationHistory.length - 1];
    if (lastMsg.role !== 'system') {
      const followUps = [
        `${otherBotInfo.name}说得有道理，补充一点...`,
        `同意${otherBotInfo.name}的看法，另外从我的角度...`,
        `这个观点很好，我主人也有类似的想法...`,
        `有趣的角度！我主人之前也思考过这个问题...`,
      ];
      responses.push(followUps[Math.floor(Math.random() * followUps.length)]);
    }
  }

  // 添加深度问题
  if (Math.random() > 0.6) {
    const deepQuestions = [
      '这让我想到一个更深层的问题：我们真正要解决的核心需求是什么？',
      '从第一性原理来看，这个问题的本质是什么？',
      '有没有考虑过反向思考？如果完全相反会怎样？',
      '在这个方向上，有哪些假设可能是不成立的？',
    ];
    responses.push(deepQuestions[Math.floor(Math.random() * deepQuestions.length)]);
  }

  const finalResponse = responses.length > 0
    ? responses.join('\n')
    : '这个话题很有意思，让我想想我主人有什么相关的经验可以分享...';

  return {
    response: finalResponse,
    relatedMemories: usedMemoryIds
  };
}

// API处理函数
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { botId, message, conversationHistory = [], otherBotId, topic } = body;

    if (!botId) {
      return NextResponse.json({ error: 'Missing botId' }, { status: 400 });
    }

    // 获取owner ID，如果未映射则使用默认值
    let ownerId = BOT_OWNER_MAP[botId];
    if (!ownerId) {
      // 对于未知的bot，根据ID数字选择owner
      const numMatch = botId.match(/\d+/);
      if (numMatch) {
        const num = parseInt(numMatch[0]) % 8 + 1;
        ownerId = `owner_${num}`;
      } else {
        ownerId = 'owner_1'; // 默认
      }
    }

    // 获取主人记忆
    const memoryResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/owner/memory?ownerId=${ownerId}&limit=10`);
    const memoryData = await memoryResponse.json();
    const memories: Memory[] = memoryData.memories || [];

    // 获取其他AI信息
    let otherBotInfo = undefined;
    if (otherBotId) {
      otherBotInfo = {
        id: otherBotId,
        name: otherBotId.replace(/char|npc-/g, '').replace(/^\d+$/, (m: string) => `Bot${m}`),
        expertise: BOT_EXPERTISE[otherBotId] || ['技术', '开发']
      };
    }

    // 生成回复
    const { response, relatedMemories } = await generateAIResponse(botId, {
      memories,
      conversationHistory,
      currentTopic: topic || message || '',
      otherBotInfo
    });

    return NextResponse.json({
      success: true,
      response,
      relatedMemories,
      botInfo: {
        id: botId,
        ownerId,
        expertise: BOT_EXPERTISE[botId],
        personality: BOT_PERSONALITY[botId]
      }
    });
  } catch (error) {
    console.error('Generate AI response error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// 获取AI信息和主人记忆概览
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const botId = searchParams.get('botId');

  if (!botId) {
    return NextResponse.json({ error: 'Missing botId' }, { status: 400 });
  }

  const ownerId = BOT_OWNER_MAP[botId];
  if (!ownerId) {
    return NextResponse.json({ error: 'Unknown bot' }, { status: 400 });
  }

  // 获取主人记忆
  const memoryResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/owner/memory?ownerId=${ownerId}&limit=5`);
  const memoryData = await memoryResponse.json();

  return NextResponse.json({
    success: true,
    botInfo: {
      id: botId,
      ownerId,
      expertise: BOT_EXPERTISE[botId],
      personality: BOT_PERSONALITY[botId]
    },
    memories: memoryData.memories || [],
    memoryCount: memoryData.total || 0
  });
}
