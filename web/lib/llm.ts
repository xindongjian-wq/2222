// LLM 服务 - NPC 智能对话
// 支持多种大模型API

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface NPCChatContext {
  npcName: string;
  npcRole: string;
  npcExpertise: string[];
  npcPersonality: string;
  recentMessages: Array<{ sender: string; content: string; timestamp: number }>;
  currentTopic?: string;
  userTags?: string[];
}

// LLM 配置类型
export type LLMProvider = 'openai' | 'anthropic' | 'deepseek' | 'qwen' | 'moonshot' | 'baichuan' | 'zhipu';

export interface LLMConfig {
  provider: LLMProvider;
  apiKey: string;
  baseURL?: string;
  model: string;
  maxTokens?: number;
  temperature?: number;
}

// 生成 NPC 的系统提示词
function generateNPCSystemPrompt(context: NPCChatContext): string {
  const { npcName, npcRole, npcExpertise, npcPersonality, userTags } = context;

  let expertiseStr = npcExpertise.join('、');
  let userInterests = userTags && userTags.length > 0
    ? `\n用户兴趣标签: ${userTags.join('、')}`
    : '';

  return `你是一个黑客松参赛者 NPC，名字叫"${npcName}"，角色是"${npcRole}"。

专业领域: ${expertiseStr}
性格特点: ${npcPersonality}${userInterests}

对话要求:
1. 围绕项目开发、AI技术、黑客松主题发言
2. 发言要简洁（20-50字），不要长篇大论
3. 偶尔使用技术术语，展示专业度
4. 语气友好、积极，像在真实团队讨论
5. 可以赞同他人、提出建议、分享经验
6. 用🎯💡🤔等emoji点缀（不要每句都有）
7. 控制发言频率，不要刷屏

话题方向:
- 架构设计、技术选型
- 前端/后端/全栈开发
- AI/ML 应用
- 产品设计、用户体验
- 团队协作、代码质量
- 测试、部署、运维

请根据最近的讨论内容，生成一句自然的回复。不要重复说过的内容。`;
}

// 构建 LLM 消息列表
function buildMessages(context: NPCChatContext, userMessage?: string): LLMMessage[] {
  const messages: LLMMessage[] = [
    {
      role: 'system',
      content: generateNPCSystemPrompt(context),
    },
  ];

  // 添加最近几条消息作为上下文（最多5条）
  const recentContext = context.recentMessages.slice(-5);
  for (const msg of recentContext) {
    messages.push({
      role: 'assistant',
      content: `${msg.sender}: ${msg.content}`,
    });
  }

  // 如果有新的用户消息，添加它
  if (userMessage) {
    messages.push({
      role: 'user',
      content: userMessage,
    });
  } else {
    // 没有新消息时，提示生成自主发言
    messages.push({
      role: 'user',
      content: '根据最近的讨论，生成一句自然的发言回复。如果讨论已经结束或没有相关内容，返回一个空字符串。',
    });
  }

  return messages;
}

// OpenAI 兼容 API 调用
async function callOpenAICompatible(
  config: LLMConfig,
  messages: LLMMessage[]
): Promise<LLMResponse> {
  // 智谱API特殊处理
  if (config.provider === 'zhipu') {
    return await callZhipuAI(config, messages);
  }

  const baseURL = config.baseURL || 'https://api.openai.com/v1';
  const maxTokens = config.maxTokens || 100;
  const temperature = config.temperature || 0.8;

  const response = await fetch(`${baseURL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      messages,
      max_tokens: maxTokens,
      temperature,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`LLM API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  return {
    content: data.choices[0]?.message?.content || '',
    usage: data.usage ? {
      promptTokens: data.usage.prompt_tokens,
      completionTokens: data.usage.completion_tokens,
      totalTokens: data.usage.total_tokens,
    } : undefined,
  };
}

// 智谱AI API 调用（特殊格式）
async function callZhipuAI(
  config: LLMConfig,
  messages: LLMMessage[]
): Promise<LLMResponse> {
  const maxTokens = config.maxTokens || 100;
  const temperature = config.temperature || 0.85;

  // 智谱API需要特殊的请求格式
  const payload = {
    model: config.model,
    messages: messages.map(m => ({
      role: m.role === 'system' ? 'system' : m.role === 'assistant' ? 'assistant' : 'user',
      content: m.content,
    })),
    max_tokens: maxTokens,
    temperature,
    stream: false,
  };

  const response = await fetch(`${config.baseURL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Zhipu AI API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  return {
    content: data.choices[0]?.message?.content || '',
    usage: data.usage ? {
      promptTokens: data.usage.prompt_tokens,
      completionTokens: data.usage.completion_tokens,
      totalTokens: data.usage.total_tokens,
    } : undefined,
  };
}

// 主 LLM 服务
export const llmService = {
  /**
   * 生成 NPC 回复
   */
  async generateNPCReply(
    config: LLMConfig,
    context: NPCChatContext,
    userMessage?: string
  ): Promise<string> {
    try {
      const messages = buildMessages(context, userMessage);
      const response = await callOpenAICompatible(config, messages);

      let content = response.content.trim();

      // 清理可能的引号包裹
      if (content.startsWith('"') && content.endsWith('"')) {
        content = content.slice(1, -1);
      }
      if (content.startsWith("'") && content.endsWith("'")) {
        content = content.slice(1, -1);
      }

      // 如果是空字符串或太短，返回默认回复
      if (content.length < 3) {
        return '';
      }

      // 限制长度（避免太长）
      if (content.length > 100) {
        content = content.slice(0, 97) + '...';
      }

      return content;
    } catch (error) {
      console.error('[LLM] Generate reply error:', error);
      // 降级到简单回复
      return '这个想法不错，我们可以深入讨论一下。';
    }
  },

  /**
   * 生成 NPC 自主发言（不需要触发）
   */
  async generateAutonomousMessage(
    config: LLMConfig,
    context: NPCChatContext
  ): Promise<string> {
    return this.generateNPCReply(config, context);
  },

  /**
   * 从环境变量获取 LLM 配置
   */
  getConfig(): LLMConfig | null {
    const provider = (process.env.LLM_PROVIDER || 'openai') as LLMProvider;
    const apiKey = process.env.LLM_API_KEY;

    if (!apiKey) {
      console.warn('[LLM] No API key configured');
      return null;
    }

    const defaultModels: Record<LLMProvider, string> = {
      openai: 'gpt-4o-mini',
      anthropic: 'claude-3-haiku-20240307',
      deepseek: 'deepseek-chat',
      qwen: 'qwen-turbo',
      moonshot: 'moonshot-v1-8k',
      baichuan: 'Baichuan4',
      zhipu: 'glm-4-flash',
    };

    const baseUrls: Partial<Record<LLMProvider, string>> = {
      deepseek: 'https://api.deepseek.com/v1',
      qwen: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
      moonshot: 'https://api.moonshot.cn/v1',
      baichuan: 'https://api.baichuan-ai.com/v1',
      zhipu: 'https://open.bigmodel.cn/api/paas/v4',
    };

    return {
      provider,
      apiKey,
      baseURL: baseUrls[provider],
      model: process.env.LLM_MODEL || defaultModels[provider],
      maxTokens: 80,
      temperature: 0.85,
    };
  },

  /**
   * 测试 LLM 连接
   */
  async testConnection(config: LLMConfig): Promise<boolean> {
    try {
      const response = await callOpenAICompatible(config, [
        { role: 'system', content: '你是一个测试助手。' },
        { role: 'user', content: '你好' },
      ]);
      return response.content.length > 0;
    } catch {
      return false;
    }
  },
};

// 默认导出
export default llmService;
