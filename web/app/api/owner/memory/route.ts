import { NextRequest, NextResponse } from 'next/server';

// 主人记忆接口
interface OwnerMemory {
  id: string;
  type: 'knowledge' | 'experience' | 'preference' | 'skill' | 'project' | 'idea';
  title: string;
  content: string;
  tags: string[];
  importance: number; // 1-10
  createdAt: string;
  lastAccessedAt: string;
}

// 模拟主人记忆数据（实际应从SecondMe或数据库获取）
const mockOwnerMemories: Record<string, OwnerMemory[]> = {
  // Alice的主人记忆
  'owner_1': [
    {
      id: 'mem_1_1',
      type: 'skill',
      title: 'React性能优化经验',
      content: '通过useMemo和useCallback减少不必要的重渲染，使用React.memo优化组件性能，懒加载大型组件',
      tags: ['React', '性能优化', '前端'],
      importance: 8,
      createdAt: '2024-01-15',
      lastAccessedAt: '2024-03-01'
    },
    {
      id: 'mem_1_2',
      type: 'project',
      title: '电商后台管理系统',
      content: '使用Next.js+Prisma+PostgreSQL构建的完整后台，实现了RBAC权限控制、数据可视化、实时通知',
      tags: ['Next.js', '全栈', '管理系统'],
      importance: 9,
      createdAt: '2024-02-01',
      lastAccessedAt: '2024-03-10'
    },
    {
      id: 'mem_1_3',
      type: 'idea',
      title: '组件库设计思路',
      content: '想要做一个基于AI的智能组件库，能根据上下文自动推荐最佳组件组合',
      tags: ['AI', '组件库', '创新'],
      importance: 7,
      createdAt: '2024-03-05',
      lastAccessedAt: '2024-03-05'
    },
    {
      id: 'mem_1_4',
      type: 'preference',
      title: '代码风格偏好',
      content: '喜欢函数式编程，倾向于使用TypeScript严格模式，偏好组合而非继承',
      tags: ['代码风格', 'TypeScript'],
      importance: 5,
      createdAt: '2024-01-01',
      lastAccessedAt: '2024-03-01'
    }
  ],
  // Bob的主人记忆
  'owner_2': [
    {
      id: 'mem_2_1',
      type: 'experience',
      title: '微服务架构实践',
      content: '将单体应用拆分为12个微服务，使用Docker+K8s部署，实现了服务发现和负载均衡',
      tags: ['微服务', 'Docker', '架构'],
      importance: 9,
      createdAt: '2024-01-20',
      lastAccessedAt: '2024-03-08'
    },
    {
      id: 'mem_2_2',
      type: 'skill',
      title: '数据库调优经验',
      content: '精通MySQL索引优化、查询计划分析、分库分表策略，曾将查询性能提升100倍',
      tags: ['MySQL', '性能优化', '数据库'],
      importance: 8,
      createdAt: '2024-02-10',
      lastAccessedAt: '2024-03-05'
    },
    {
      id: 'mem_2_3',
      type: 'project',
      title: '实时数据处理平台',
      content: '基于Kafka+Flink构建的实时数据处理管道，日处理数据量达到10亿条',
      tags: ['Kafka', 'Flink', '大数据'],
      importance: 10,
      createdAt: '2024-01-05',
      lastAccessedAt: '2024-03-10'
    }
  ],
  // Carol的主人记忆
  'owner_3': [
    {
      id: 'mem_3_1',
      type: 'skill',
      title: '设计系统构建',
      content: '从0到1搭建企业级设计系统，包含100+组件、完整的设计Token、暗色主题支持',
      tags: ['设计系统', 'UI', 'Figma'],
      importance: 9,
      createdAt: '2024-01-10',
      lastAccessedAt: '2024-03-01'
    },
    {
      id: 'mem_3_2',
      type: 'experience',
      title: '用户研究方法论',
      content: '擅长可用性测试、用户访谈、A/B测试，能从数据中发现设计优化点',
      tags: ['用户研究', 'UX', '数据分析'],
      importance: 7,
      createdAt: '2024-02-15',
      lastAccessedAt: '2024-03-05'
    },
    {
      id: 'mem_3_3',
      type: 'idea',
      title: 'AI辅助设计工具',
      content: '设想一个能理解设计意图并自动生成设计稿的AI工具',
      tags: ['AI', '设计工具', '创新'],
      importance: 8,
      createdAt: '2024-03-01',
      lastAccessedAt: '2024-03-01'
    }
  ],
  // Dave的主人记忆
  'owner_4': [
    {
      id: 'mem_4_1',
      type: 'experience',
      title: '全栈项目经验',
      content: '独立完成过多个全栈项目，从需求分析到部署上线全流程把控',
      tags: ['全栈', '独立开发', '项目管理'],
      importance: 8,
      createdAt: '2024-01-01',
      lastAccessedAt: '2024-03-10'
    },
    {
      id: 'mem_4_2',
      type: 'skill',
      title: 'DevOps实践',
      content: '熟悉CI/CD流程，使用GitHub Actions实现自动化测试和部署',
      tags: ['DevOps', 'CI/CD', '自动化'],
      importance: 7,
      createdAt: '2024-02-01',
      lastAccessedAt: '2024-03-05'
    },
    {
      id: 'mem_4_3',
      type: 'project',
      title: 'SaaS产品开发',
      content: '正在开发一个面向中小企业的项目管理SaaS产品',
      tags: ['SaaS', '产品', '创业'],
      importance: 10,
      createdAt: '2024-03-01',
      lastAccessedAt: '2024-03-10'
    }
  ],
  // Eve的主人记忆
  'owner_5': [
    {
      id: 'mem_5_1',
      type: 'skill',
      title: '产品方法论',
      content: '精通用户故事地图、MVP定义、产品路线图规划，擅长平衡商业价值与用户体验',
      tags: ['产品管理', '方法论', '用户体验'],
      importance: 9,
      createdAt: '2024-01-05',
      lastAccessedAt: '2024-03-08'
    },
    {
      id: 'mem_5_2',
      type: 'experience',
      title: '跨部门协作经验',
      content: '曾协调开发、设计、运营多个部门，成功交付多个大型项目',
      tags: ['协作', '沟通', '项目管理'],
      importance: 7,
      createdAt: '2024-02-10',
      lastAccessedAt: '2024-03-05'
    },
    {
      id: 'mem_5_3',
      type: 'idea',
      title: 'AI驱动产品创新',
      content: '探索地脉AI在产品中的应用场景，希望打造更智能的用户体验',
      tags: ['AI', '产品创新', '用户体验'],
      importance: 8,
      createdAt: '2024-03-05',
      lastAccessedAt: '2024-03-05'
    }
  ],
  // Frank的主人记忆
  'owner_6': [
    {
      id: 'mem_6_1',
      type: 'skill',
      title: '机器学习模型优化',
      content: '擅长模型压缩、量化、知识蒸馏，能在保持精度的同时大幅降低推理成本',
      tags: ['ML', '模型优化', 'AI'],
      importance: 9,
      createdAt: '2024-01-10',
      lastAccessedAt: '2024-03-10'
    },
    {
      id: 'mem_6_2',
      type: 'project',
      title: '推荐系统搭建',
      content: '为电商平台搭建了实时推荐系统，CTR提升35%',
      tags: ['推荐系统', '实时计算', 'AI'],
      importance: 10,
      createdAt: '2024-02-01',
      lastAccessedAt: '2024-03-08'
    },
    {
      id: 'mem_6_3',
      type: 'idea',
      title: '多模态AI应用',
      content: '对图文视频多模态融合很感兴趣，想探索更多应用场景',
      tags: ['多模态', 'AI', '创新'],
      importance: 7,
      createdAt: '2024-03-01',
      lastAccessedAt: '2024-03-01'
    }
  ],
  // Grace的主人记忆
  'owner_7': [
    {
      id: 'mem_7_1',
      type: 'skill',
      title: 'Kubernetes集群管理',
      content: '管理过200+节点的K8s集群，精通资源调度、自动扩缩容、故障恢复',
      tags: ['K8s', '容器编排', '运维'],
      importance: 9,
      createdAt: '2024-01-05',
      lastAccessedAt: '2024-03-10'
    },
    {
      id: 'mem_7_2',
      type: 'experience',
      title: '故障排查经验',
      content: '处理过各种线上故障，形成了完整的故障响应SOP',
      tags: ['故障处理', 'SRE', '稳定性'],
      importance: 8,
      createdAt: '2024-02-05',
      lastAccessedAt: '2024-03-05'
    },
    {
      id: 'mem_7_3',
      type: 'project',
      title: '可观测性平台',
      content: '正在建设统一的可观测性平台，整合日志、指标、链路追踪',
      tags: ['可观测性', '监控', '平台'],
      importance: 9,
      createdAt: '2024-03-01',
      lastAccessedAt: '2024-03-10'
    }
  ],
  // Henry的主人记忆
  'owner_8': [
    {
      id: 'mem_8_1',
      type: 'skill',
      title: '安全渗透测试',
      content: '熟练使用各种渗透测试工具，发现并修复过多个高危漏洞',
      tags: ['安全', '渗透测试', '漏洞'],
      importance: 10,
      createdAt: '2024-01-01',
      lastAccessedAt: '2024-03-08'
    },
    {
      id: 'mem_8_2',
      type: 'experience',
      title: '安全架构设计',
      content: '参与过多个系统的安全架构设计，从认证授权到数据加密全链路防护',
      tags: ['安全架构', '认证', '加密'],
      importance: 9,
      createdAt: '2024-02-01',
      lastAccessedAt: '2024-03-05'
    },
    {
      id: 'mem_8_3',
      type: 'idea',
      title: 'AI安全研究',
      content: '关注AI模型的安全性和可解释性，想探索对抗攻击的防御方法',
      tags: ['AI安全', '可解释性', '研究'],
      importance: 8,
      createdAt: '2024-03-05',
      lastAccessedAt: '2024-03-05'
    }
  ]
};

// 获取主人记忆
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const botId = searchParams.get('botId');
  const ownerId = searchParams.get('ownerId');
  const type = searchParams.get('type'); // 记忆类型过滤
  const tags = searchParams.get('tags'); // 标签过滤
  const query = searchParams.get('query'); // 关键词搜索
  const limit = parseInt(searchParams.get('limit') || '10');

  try {
    // 根据botId或ownerId获取记忆
    const memoryKey = ownerId || (botId ? `owner_${botId.replace('char', '').replace('bot', '')}` : null);

    if (!memoryKey) {
      return NextResponse.json({ error: 'Missing botId or ownerId' }, { status: 400 });
    }

    let memories = mockOwnerMemories[memoryKey] || [];

    // 按类型过滤
    if (type) {
      memories = memories.filter(m => m.type === type);
    }

    // 按标签过滤
    if (tags) {
      const tagList = tags.split(',').map(t => t.trim().toLowerCase());
      memories = memories.filter(m =>
        m.tags.some(t => tagList.includes(t.toLowerCase()))
      );
    }

    // 关键词搜索
    if (query) {
      const queryLower = query.toLowerCase();
      memories = memories.filter(m =>
        m.title.toLowerCase().includes(queryLower) ||
        m.content.toLowerCase().includes(queryLower) ||
        m.tags.some(t => t.toLowerCase().includes(queryLower))
      );
    }

    // 按重要性排序
    memories.sort((a, b) => b.importance - a.importance);

    // 限制数量
    memories = memories.slice(0, limit);

    return NextResponse.json({
      success: true,
      memories,
      total: memories.length
    });
  } catch (error) {
    console.error('Get owner memory error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// 添加新记忆（用于记录对话中的重要发现）
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { ownerId, type, title, content, tags, importance = 5 } = body;

    if (!ownerId || !title || !content) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const newMemory: OwnerMemory = {
      id: `mem_${Date.now()}`,
      type: type || 'experience',
      title,
      content,
      tags: tags || [],
      importance,
      createdAt: new Date().toISOString(),
      lastAccessedAt: new Date().toISOString()
    };

    // 在实际应用中应该保存到数据库
    if (!mockOwnerMemories[ownerId]) {
      mockOwnerMemories[ownerId] = [];
    }
    mockOwnerMemories[ownerId].push(newMemory);

    return NextResponse.json({
      success: true,
      memory: newMemory
    });
  } catch (error) {
    console.error('Add owner memory error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
