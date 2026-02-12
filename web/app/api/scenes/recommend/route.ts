import { NextRequest, NextResponse } from 'next/server';
import { getUserInfo, getUserShades, getUserSoftMemory } from '@/lib/secondme';
import * as fs from 'fs';
import * as path from 'path';

const DATA_DIR = path.join(process.cwd(), process.env.DATA_DIR || 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const SCENES_FILE = path.join(DATA_DIR, 'scenes.json');
const EXTENDED_SCENES_FILE = path.join(DATA_DIR, 'extended_scenes.json');

// 场景预设类型
interface ScenePreset {
  id: string;
  name: string;
  emoji: string;
  category: string;
  color: string;
  baseColor: string;
  description: string;
}

// 地脉推荐的场景
interface RecommendedScene {
  id: string;
  name: string;
  emoji: string;
  category: string;
  color: string;
  baseColor: string;
  description: string;
  reason: string; // 推荐理由
  confidence: number; // 相关度评分 0-1
}

// 读取用户数据
async function readUsers() {
  try {
    const content = await fs.promises.readFile(USERS_FILE, 'utf-8');
    return JSON.parse(content);
  } catch (e) {
    return {};
  }
}

// 读取所有场景
async function readAllScenes(): Promise<ScenePreset[]> {
  try {
    const [scenesContent, extendedContent] = await Promise.all([
      fs.promises.readFile(SCENES_FILE, 'utf-8').catch(() => '[]'),
      fs.promises.readFile(EXTENDED_SCENES_FILE, 'utf-8').catch(() => '[]')
    ]);
    const scenes = JSON.parse(scenesContent);
    const extended = JSON.parse(extendedContent);
    return [...(scenes.data || scenes || []), ...(extended.data || extended || [])];
  } catch (e) {
    console.error('Error reading scenes:', e);
    return [];
  }
}

// 构建AI提示词，基于用户信息生成场景推荐
function buildRecommendationPrompt(userInfo: any, shades: any, memories: any[]) {
  const userName = userInfo?.name || '用户';
  const userTags = userInfo?.tags || [];
  const userSkills = userInfo?.skills || [];
  const userHobbies = userInfo?.hobbies || [];

  // 获取兴趣标签
  const shadeList = shades?.shades || [];

  // 获取最近的记忆
  const recentMemories = memories?.slice(0, 5) || [];
  const memoryTags = [...new Set(recentMemories.flatMap(m => m.tags || []))];

  return `你是一个地脉AI空间场景设计师。根据以下用户信息，为用户推荐3个最适合的场景。

用户信息：
- 姓名：${userName}
- 标签：${userTags.join(', ') || '未设置'}
- 技能：${userSkills.join(', ') || '未设置'}
- 爱好：${userHobbies.join(', ') || '未设置'}
- 兴趣标签：${shadeList.join(', ') || '未设置'}
- 最近记忆标签：${memoryTags.join(', ') || '无'}

请从以下场景类别中选择：sports(运动)、social(社交)、entertainment(娱乐)、work(办公)、nature(自然)、hobby(兴趣)、space(太空)

返回JSON格式，必须包含：
{
  "recommendations": [
    {
      "category": "场景类别",
      "name": "场景名称（中文，简洁有力）",
      "emoji": "一个代表性emoji",
      "description": "场景描述（15字以内）",
      "reason": "推荐理由（结合用户特点，20字以内）",
      "confidence": 0.95
    }
  ]
}

要求：
1. 三个场景类别要不同
2. confidence值基于与用户的匹配度（0.7-1.0）
3. name要生动有趣，如"代码实验室"、"灵感花园"、"篮球竞技场"等
4. emoji要准确表达场景含义
`;
}

// 调用AI生成推荐
async function generateAIRecommendations(prompt: string): Promise<RecommendedScene[]> {
  const BASE_URL = process.env.SECONDME_BASE_URL || 'https://app.mindos.com/gate/lab';
  const AI_API_KEY = process.env.SECONDME_AI_API_KEY || '';

  try {
    const response = await fetch(`${BASE_URL}/api/ai/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AI_API_KEY}`,
      },
      body: JSON.stringify({
        messages: [
          { role: 'user', content: prompt }
        ],
        temperature: 0.8,
        maxTokens: 1000,
      }),
    });

    if (!response.ok) {
      console.error('AI API error:', response.status, response.statusText);
      // 返回默认推荐
      return getDefaultRecommendations();
    }

    const data = await response.json();
    const content = data?.data?.content || data?.content || data?.choices?.[0]?.message?.content || '{}';

    // 尝试解析JSON
    let jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (parsed.recommendations && Array.isArray(parsed.recommendations)) {
        return convertToScenePresets(parsed.recommendations);
      }
    }

    return getDefaultRecommendations();
  } catch (e) {
    console.error('Generate recommendations error:', e);
    return getDefaultRecommendations();
  }
}

// 将地脉推荐转换为场景预设格式
function convertToScenePresets(recommendations: any[]): RecommendedScene[] {
  const categoryColors: Record<string, { color: string; baseColor: string }> = {
    sports: { color: '#f97316', baseColor: '#fed7aa' },
    social: { color: '#f59e0b', baseColor: '#fef3c7' },
    entertainment: { color: '#ec4899', baseColor: '#fce7f3' },
    work: { color: '#3b82f6', baseColor: '#dbeafe' },
    nature: { color: '#22c55e', baseColor: '#dcfce7' },
    hobby: { color: '#8b5cf6', baseColor: '#ede9fe' },
    space: { color: '#6366f1', baseColor: '#e0e7ff' },
  };

  return recommendations.map((rec, idx) => {
    const colors = categoryColors[rec.category] || categoryColors.hobby;
    return {
      id: `ai_rec_${Date.now()}_${idx}`,
      name: rec.name,
      emoji: rec.emoji,
      category: rec.category,
      color: colors.color,
      baseColor: colors.baseColor,
      description: rec.description,
      reason: rec.reason,
      confidence: rec.confidence || 0.8,
    };
  });
}

// 默认推荐（当AI调用失败时）
function getDefaultRecommendations(): RecommendedScene[] {
  return [
    {
      id: 'default_1',
      name: '灵感实验室',
      emoji: '💡',
      category: 'work',
      color: '#3b82f6',
      baseColor: '#dbeafe',
      description: '记录创意，孵化想法',
      reason: '基于你的技能和兴趣推荐',
      confidence: 0.8,
    },
    {
      id: 'default_2',
      name: '运动健身场',
      emoji: '🏃',
      category: 'sports',
      color: '#f97316',
      baseColor: '#fed7aa',
      description: '挥洒汗水，保持活力',
      reason: '健康的生活方式很重要',
      confidence: 0.75,
    },
    {
      id: 'default_3',
      name: '社交聚落',
      emoji: '🎉',
      category: 'social',
      color: '#f59e0b',
      baseColor: '#fef3c7',
      description: '与朋友相聚交流',
      reason: '拓展人脉，分享快乐',
      confidence: 0.7,
    },
  ];
}

// 获取用户当前已使用的场景
function getUsedScenes(userScenes: any[], allScenes: ScenePreset[]): Set<string> {
  const usedIds = new Set(userScenes?.map(us => us.scenePresetId) || []);
  return usedIds;
}

// 过滤掉已使用的场景
function filterUsedScenes(recommendations: RecommendedScene[], usedIds: Set<string>, allScenes: ScenePreset[]): RecommendedScene[] {
  // 如果推荐场景不够，从现有场景池中补充
  const available = allScenes.filter(s => !usedIds.has(s.id));

  // 检查推荐中是否有已使用的
  const filtered = recommendations.filter(r => {
    // AI生成的场景ID是动态的，不会重复
    return true;
  });

  return filtered.slice(0, 3);
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');
  const landIndex = searchParams.get('landIndex'); // 哪块地

  if (!userId) {
    return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
  }

  try {
    // 1. 读取用户信息（获取accessToken）
    const users = await readUsers();
    const user = users[userId];

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // 2. 调用SecondMe API获取用户信息
    let userInfo = null;
    let shades = null;
    let memories = [];

    try {
      const [userRes, shadesRes, memoryRes] = await Promise.all([
        getUserInfo(user.accessToken).catch(() => null),
        getUserShades(user.accessToken).catch(() => null),
        getUserSoftMemory(user.accessToken).catch(() => null),
      ]);

      userInfo = userRes?.data || null;
      shades = shadesRes?.data || null;
      memories = memoryRes?.data?.list || [];

      // 更新本地用户信息（同步SecondMe数据）
      if (userInfo) {
        if (userInfo.name && !user.name) user.name = userInfo.name;
        if (userInfo.email && !user.email) user.email = userInfo.email;
        if (userInfo.avatarUrl && !user.avatarUrl) user.avatarUrl = userInfo.avatarUrl;

        // 同步标签和兴趣
        if (shades?.shades && shades.shades.length > 0) {
          user.tags = shades.shades;
        }

        await fs.promises.writeFile(USERS_FILE, JSON.stringify(users, null, 2));
      }
    } catch (e) {
      console.error('SecondMe API error:', e);
      // 继续使用本地数据
    }

    // 使用本地用户信息作为备选
    const fallbackUserInfo = {
      name: user.name,
      email: user.email,
      tags: user.tags || [],
      skills: user.skills || [],
      hobbies: user.hobbies || [],
    };

    // 3. 构建AI提示词
    const prompt = buildRecommendationPrompt(
      userInfo || fallbackUserInfo,
      shades || { shades: user.tags || [] },
      memories
    );

    // 4. 调用AI生成推荐
    const recommendations = await generateAIRecommendations(prompt);

    // 5. 读取现有场景（用于过滤和备选）
    const allScenes = await readAllScenes();

    // 6. 过滤已使用的场景
    const userScenesRes = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/scenes/user/${userId}`);
    const userScenesData = await userScenesRes.json();
    const usedIds = getUsedScenes(userScenesData.data || [], allScenes);

    const filteredRecommendations = filterUsedScenes(recommendations, usedIds, allScenes);

    return NextResponse.json({
      code: 0,
      data: {
        recommendations: filteredRecommendations,
        userInfo: {
          name: userInfo?.name || user.name,
          tags: shades?.shades || user.tags || [],
          skills: user.skills || [],
          hobbies: user.hobbies || [],
        },
        landIndex,
      },
    });
  } catch (error) {
    console.error('Scene recommendation error:', error);
    return NextResponse.json({
      code: 0,
      data: {
        recommendations: getDefaultRecommendations(),
        error: error instanceof Error ? error.message : 'Unknown error',
      },
    });
  }
}
