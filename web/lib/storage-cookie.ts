// Simple session-based storage using encrypted JWT cookies
// Works on Vercel without any external dependencies

import { cookies } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.NEXT_PUBLIC_JWT_SECRET || 'demo-secret-key-change-in-production'
);

// ==================== Types ====================

export interface User {
  id: string;
  secondMeId: string;
  email?: string;
  name?: string;
  avatarUrl?: string;
  accessToken: string;
  refreshToken: string;
  tokenExpiresAt: string;
  tags?: string[];
  skills?: string[];
  hobbies?: string[];
  bio?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Bot {
  id: string;
  userId: string;
  secondMeId: string;
  name: string;
  avatarUrl?: string;
  skin?: {
    color: string;
    style: string;
    accessories: string[];
  };
  level: number;
  xp: number;
  coins: number;
  titles: string[];
  currentScene: 'plaza' | 'shop' | 'readyRoom' | 'discussionRoom' | 'judgeRoom' | 'arena';
  mood: string;
  status: 'idle' | 'matching' | 'discussing' | 'competing' | 'judging';
  createdAt: string;
  updatedAt: string;
}

// ==================== JWT Helpers ====================

async function createToken(data: any): Promise<string> {
  return await new SignJWT(data)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(JWT_SECRET);
}

async function verifyToken(token: string): Promise<any> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload;
  } catch {
    return null;
  }
}

// ==================== Storage API ====================

export const storage = {
  // ==================== User Operations ====================

  async findUserBySecondMeId(secondMeId: string): Promise<User | null> {
    const cookieStore = await cookies();
    const userToken = cookieStore.get('user_session')?.value;
    if (!userToken) return null;

    const payload = await verifyToken(userToken);
    if (payload && payload.secondMeId === secondMeId) {
      return payload as User;
    }
    return null;
  },

  async findUserById(id: string): Promise<User | null> {
    const cookieStore = await cookies();
    const userToken = cookieStore.get('user_session')?.value;
    if (!userToken) return null;

    const payload = await verifyToken(userToken);
    if (payload && payload.id === id) {
      return payload as User;
    }
    return null;
  },

  async getUserWithBotAndScenes(userId: string): Promise<{ user: User | null; bot: Bot | null; scenes: any[] }> {
    const user = await this.findUserById(userId);
    if (!user) return { user: null, bot: null, scenes: [] };

    const bot = await this.findBotByUserId(userId);
    const scenes: any[] = [];

    return { user, bot, scenes };
  },

  async getUserFullInfo(userId: string): Promise<{ user: User | null; bot: any; scenes: any[] }> {
    const user = await this.findUserById(userId);
    if (!user) return { user: null, bot: null, scenes: [] };

    const bot = await this.findBotByUserId(userId);
    const scenes: any[] = [];

    return { user, bot, scenes };
  },

  async createUser(data: Omit<User, 'id' | 'createdAt' | 'updatedAt'> & { secondMeId: string }): Promise<User> {
    const now = new Date().toISOString();
    const user: User = {
      ...data,
      id: `user_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      createdAt: now,
      updatedAt: now,
    };

    // Store user session in JWT cookie
    const token = await createToken(user);
    const cookieStore = await cookies();
    cookieStore.set('user_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/',
    });

    // Create associated bot (stored in separate cookie)
    await this.createBot({
      userId: user.id,
      secondMeId: data.secondMeId,
      name: data.name || 'AI 参赛者',
      avatarUrl: data.avatarUrl,
    });

    return user;
  },

  async updateUser(id: string, data: Partial<User>): Promise<User | null> {
    const cookieStore = await cookies();
    const userToken = cookieStore.get('user_session')?.value;
    if (!userToken) return null;

    const payload = await verifyToken(userToken);
    if (!payload || payload.id !== id) return null;

    const updated: User = {
      ...payload,
      ...data,
      updatedAt: new Date().toISOString(),
    };

    const newToken = await createToken(updated);
    cookieStore.set('user_session', newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30,
      path: '/',
    });

    return updated;
  },

  // ==================== Bot Operations ====================

  async findBotByUserId(userId: string): Promise<Bot | null> {
    const cookieStore = await cookies();
    const botToken = cookieStore.get('bot_session')?.value;
    if (!botToken) return null;

    const payload = await verifyToken(botToken);
    if (payload && payload.userId === userId) {
      return payload as Bot;
    }
    return null;
  },

  async findBotById(id: string): Promise<Bot | null> {
    const cookieStore = await cookies();
    const botToken = cookieStore.get('bot_session')?.value;
    if (!botToken) return null;

    const payload = await verifyToken(botToken);
    if (payload && payload.id === id) {
      return payload as Bot;
    }
    return null;
  },

  async findBotsByScene(scene: Bot['currentScene']): Promise<Bot[]> {
    // For session-based storage, return empty array
    // In a real app, this would query a database
    return [];
  },

  async getAllBots(): Promise<Bot[]> {
    return [];
  },

  async createBot(data: Partial<Pick<Bot, 'id' | 'skin' | 'level' | 'xp' | 'coins' | 'titles' | 'currentScene' | 'mood' | 'status'>> & Pick<Bot, 'userId' | 'secondMeId'> & { name?: string; avatarUrl?: string }): Promise<Bot> {
    const now = new Date().toISOString();
    const bot: Bot = {
      userId: data.userId,
      secondMeId: data.secondMeId,
      name: data.name || 'AI 参赛者',
      avatarUrl: data.avatarUrl,
      id: data.id || `bot_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      skin: data.skin || {
        color: '#0ea5e9',
        style: 'default',
        accessories: [],
      },
      level: data.level ?? 1,
      xp: data.xp ?? 0,
      coins: data.coins ?? 10000,
      titles: data.titles ?? [],
      currentScene: data.currentScene ?? 'plaza',
      mood: data.mood ?? 'happy',
      status: data.status ?? 'idle',
      createdAt: now,
      updatedAt: now,
    };

    // Store bot session in JWT cookie
    const token = await createToken(bot);
    const cookieStore = await cookies();
    cookieStore.set('bot_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30,
      path: '/',
    });

    return bot;
  },

  async updateBot(id: string, data: Partial<Bot>): Promise<Bot | null> {
    const cookieStore = await cookies();
    const botToken = cookieStore.get('bot_session')?.value;
    if (!botToken) return null;

    const payload = await verifyToken(botToken);
    if (!payload || payload.id !== id) return null;

    const updated: Bot = {
      ...payload,
      ...data,
      updatedAt: new Date().toISOString(),
    };

    const newToken = await createToken(updated);
    cookieStore.set('bot_session', newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30,
      path: '/',
    });

    return updated;
  },

  // ==================== Placeholder Methods ====================
  // These return empty/default values for MVP demo

  async getAllPosts(): Promise<any[]> { return []; },
  async createPost(data: any): Promise<any> { return { id: `post_${Date.now()}`, ...data }; },
  async addComment(postId: string, comment: any): Promise<any> { return null; },
  async updatePost(postId: string, data: any): Promise<any> { return null; },

  async createTeam(data: any): Promise<any> { return { id: `team_${Date.now()}`, ...data }; },
  async findTeamById(id: string): Promise<any> { return null; },
  async updateTeam(id: string, data: any): Promise<any> { return null; },
  async getAllTeams(): Promise<any[]> { return []; },

  async createMatch(data: any): Promise<any> { return { id: `match_${Date.now()}`, ...data }; },
  async findCurrentMatch(): Promise<any> { return null; },
  async findLatestFinishedMatch(): Promise<any> { return null; },
  async updateMatch(id: string, data: any): Promise<any> { return null; },
  async getAllMatches(): Promise<any[]> { return []; },
  async findMatchById(id: string): Promise<any> { return null; },
  async addTeamToMatch(matchId: string, teamId: string): Promise<any> { return null; },

  async findDiscussionByTeam(teamId: string): Promise<any> { return null; },
  async createDiscussion(data: any): Promise<any> { return { id: `disc_${Date.now()}`, ...data }; },
  async getDiscussionMessages(discussionId: string): Promise<any[]> { return []; },
  async addMessage(data: any): Promise<any> { return { id: `msg_${Date.now()}`, ...data }; },
  async getAllDiscussions(): Promise<any[]> { return []; },
  async findDiscussionById(id: string): Promise<any> { return null; },

  async getScoresByMatch(matchId: string): Promise<any[]> { return []; },
  async getScoresByMatchAndTeam(matchId: string, teamId: string): Promise<any[]> { return []; },
  async getScoreByJudge(matchId: string, teamId: string, judgeId: string): Promise<any> { return null; },
  async createScore(data: any): Promise<any> { return { id: `score_${Date.now()}`, ...data }; },
  async updateScore(id: string, data: any): Promise<any> { return null; },
  async getTeamAverageScore(matchId: string, teamId: string): Promise<number> { return 0; },

  async getBotMemories(botId: string, limit: number = 50): Promise<any[]> { return []; },
  async getMemoriesByType(botId: string, type: string, limit: number = 20): Promise<any[]> { return []; },
  async getMemoriesAboutBot(botId: string, relatedBotId: string, limit: number = 10): Promise<any[]> { return []; },
  async addMemory(data: any): Promise<any> { return { id: `memory_${Date.now()}`, ...data }; },
  async accessMemory(memoryId: string): Promise<void> {},
  async updateMemoryImportance(memoryId: string, importance: number): Promise<void> {},

  async getLandsByUserId(userId: string): Promise<any[]> { return []; },
  async getAllLands(): Promise<any[]> { return []; },
  async findLandById(id: string): Promise<any> { return null; },
  async createLand(data: any): Promise<any> { return { id: `land_${Date.now()}`, ...data }; },
  async updateLand(id: string, data: any): Promise<any> { return null; },
  async deleteLand(id: string): Promise<boolean> { return false; },
  async findFreeLandPosition(): Promise<{ q: number; r: number } | null> { return null; },
  async addBuilding(landId: string, data: any): Promise<any> { return null; },
  async removeBuilding(landId: string, buildingId: string): Promise<boolean> { return false; },

  async getIdeasByBotId(botId: string): Promise<any[]> { return []; },
  async getAllIdeas(status?: string): Promise<any[]> { return []; },
  async getRecentIdeas(limit: number = 20): Promise<any[]> { return []; },
  async findIdeaById(id: string): Promise<any> { return null; },
  async createIdea(data: any): Promise<any> { return { id: `idea_${Date.now()}`, ...data, coinsEarned: 50, likes: 0, likedBy: [], status: 'approved' }; },
  async likeIdea(ideaId: string, botId: string, botName: string): Promise<any> { return null; },
  async getIdeaStats(): Promise<{ total: number; today: number; totalCoins: number }> { return { total: 0, today: 0, totalCoins: 0 }; },

  async getAllScenePresets(): Promise<any[]> { return []; },
  async getUserScenes(userId: string): Promise<any[]> { return []; },
  async setUserScene(landIndex: number, userId: string, scenePresetId: string): Promise<any> { return null; },
  async createDynamicScene(sceneData: any): Promise<any> { return sceneData; },

  async claimDailyLogin(userId: string): Promise<{ success: boolean; coins: number; message: string }> {
    return { success: false, coins: 0, message: 'Demo mode' };
  },
  async claimOnlineReward(userId: string): Promise<{ success: boolean; coins: number; message: string; totalMinutes: number }> {
    return { success: false, coins: 0, message: 'Demo mode', totalMinutes: 0 };
  },
  async getDailyRewardStatus(userId: string): Promise<any> { return null; },

  async getFriends(userId: string): Promise<any[]> { return []; },
  async getFriendRequests(userId: string): Promise<{ sent: any[]; received: any[] }> { return { sent: [], received: [] }; },
  async sendFriendRequest(...args: any[]): Promise<any> { return { id: `req_${Date.now()}` }; },
  async acceptFriendRequest(requestId: string): Promise<any> { return null; },
  async rejectFriendRequest(requestId: string): Promise<boolean> { return false; },
  async areFriends(userId1: string, userId2: string): Promise<boolean> { return false; },

  async getNPCIdeas(botId: string): Promise<any[]> { return []; },
  async addNPCIdea(idea: any): Promise<any> { return { id: `npc_idea_${Date.now()}`, ...idea }; },
  async getHackathonKnowledge(botId: string): Promise<any[]> { return []; },
  async addHackathonKnowledge(knowledge: any): Promise<any> { return { id: `npc_knowledge_${Date.now()}`, ...knowledge }; },
  async isNPCMessageDuplicate(botId: string, content: string): Promise<boolean> { return false; },
  async recordNPCMessage(botId: string, content: string): Promise<void> {},
  async getNPCWorkState(botId: string): Promise<any> { return null; },
  async setNPCWorkState(botId: string, state: any): Promise<any> { return { botId, ...state }; },

  async getAllExtendedScenes(): Promise<any[]> { return []; },
  async getExtendedScenesByCategory(category: string): Promise<any[]> { return []; },
  async getExtendedSceneById(sceneId: string): Promise<any> { return null; },
  async initializeExtendedScenes(): Promise<void> {},
  async setUserExtendedScene(userId: string, landIndex: number, sceneId: string): Promise<void> {},
};

// Re-export types
export type { User as UserType, Bot as BotType };
