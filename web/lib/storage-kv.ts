// Vercel KV-based storage for serverless environment
// This replaces the file-based storage which doesn't work on Vercel

import { kv } from '@vercel/kv';

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
  ownerTags?: string[];
  ownerSkills?: string[];
  ownerHobbies?: string[];
  ownerBio?: string;
  isNPC?: boolean;
  npcType?: string;
  createdAt: string;
  updatedAt: string;
}

// Helper functions for KV key generation
const Keys = {
  userBySecondMeId: (secondMeId: string) => `user:secondme:${secondMeId}`,
  userById: (id: string) => `user:id:${id}`,
  botByUserId: (userId: string) => `bot:user:${userId}`,
  botById: (id: string) => `bot:id:${id}`,
  allUsers: () => `users:all`,
  allBots: () => `bots:all`,
};

// Simple ID generator
function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(7)}`;
}

function now(): string {
  return new Date().toISOString();
}

// ==================== Storage API ====================

export const storage = {
  // ==================== User Operations ====================

  async findUserBySecondMeId(secondMeId: string): Promise<User | null> {
    const userId = await kv.get<string>(Keys.userBySecondMeId(secondMeId));
    if (!userId) return null;
    return await kv.get<User>(Keys.userById(userId)) || null;
  },

  async findUserById(id: string): Promise<User | null> {
    return await kv.get<User>(Keys.userById(id)) || null;
  },

  async getUserWithBotAndScenes(userId: string): Promise<{ user: User | null; bot: Bot | null; scenes: any[] }> {
    const user = await this.findUserById(userId);
    if (!user) return { user: null, bot: null, scenes: [] };

    const bot = await this.findBotByUserId(userId);
    const scenes = []; // Scenes to be implemented

    return { user, bot, scenes };
  },

  async getUserFullInfo(userId: string): Promise<{ user: User | null; bot: any; scenes: any[] }> {
    const user = await this.findUserById(userId);
    if (!user) return { user: null, bot: null, scenes: [] };

    const bot = await this.findBotByUserId(userId);
    const scenes = [];

    const botWithOwnerInfo = bot ? {
      ...bot,
      ownerTags: user.tags || [],
      ownerSkills: user.skills || [],
      ownerHobbies: user.hobbies || [],
    } : null;

    return { user, bot: botWithOwnerInfo, scenes };
  },

  async createUser(data: Omit<User, 'id' | 'createdAt' | 'updatedAt'> & { secondMeId: string }): Promise<User> {
    const id = generateId('user');
    const user: User = {
      ...data,
      id,
      createdAt: now(),
      updatedAt: now(),
    };

    // Store user data
    await kv.set(Keys.userById(id), user);
    await kv.set(Keys.userBySecondMeId(data.secondMeId), id);

    // Add to users list
    const userIds = (await kv.get<string[]>(Keys.allUsers())) || [];
    userIds.push(id);
    await kv.set(Keys.allUsers(), userIds);

    // Create associated bot
    await this.createBot({
      userId: user.id,
      secondMeId: data.secondMeId,
      name: data.name || 'AI 参赛者',
      avatarUrl: data.avatarUrl,
    });

    return user;
  },

  async updateUser(id: string, data: Partial<User>): Promise<User | null> {
    const existing = await this.findUserById(id);
    if (!existing) return null;

    const updated: User = {
      ...existing,
      ...data,
      updatedAt: now(),
    };

    await kv.set(Keys.userById(id), updated);
    return updated;
  },

  // ==================== Bot Operations ====================

  async findBotByUserId(userId: string): Promise<Bot | null> {
    return await kv.get<Bot>(Keys.botByUserId(userId)) || null;
  },

  async findBotById(id: string): Promise<Bot | null> {
    return await kv.get<Bot>(Keys.botById(id)) || null;
  },

  async findBotsByScene(scene: Bot['currentScene']): Promise<Bot[]> {
    const botIds = await kv.get<string[]>(Keys.allBots()) || [];
    const bots: Bot[] = [];
    for (const botId of botIds) {
      const bot = await kv.get<Bot>(Keys.botById(botId));
      if (bot && bot.currentScene === scene) {
        bots.push(bot);
      }
    }
    return bots;
  },

  async getAllBots(): Promise<Bot[]> {
    const botIds = await kv.get<string[]>(Keys.allBots()) || [];
    const bots: Bot[] = [];
    for (const botId of botIds) {
      const bot = await kv.get<Bot>(Keys.botById(botId));
      if (bot) bots.push(bot);
    }
    return bots;
  },

  async createBot(data: Partial<Pick<Bot, 'id' | 'skin' | 'level' | 'xp' | 'coins' | 'titles' | 'currentScene' | 'mood' | 'status'>> & Pick<Bot, 'userId' | 'secondMeId'> & { name?: string; avatarUrl?: string }): Promise<Bot> {
    const id = data.id || generateId('bot');
    const bot: Bot = {
      userId: data.userId,
      secondMeId: data.secondMeId,
      name: data.name || 'AI 参赛者',
      avatarUrl: data.avatarUrl,
      id,
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
      createdAt: now(),
      updatedAt: now(),
    };

    // Store bot data
    await kv.set(Keys.botById(id), bot);
    await kv.set(Keys.botByUserId(data.userId), id);

    // Add to bots list
    const botIds = (await kv.get<string[]>(Keys.allBots())) || [];
    botIds.push(id);
    await kv.set(Keys.allBots(), botIds);

    return bot;
  },

  async updateBot(id: string, data: Partial<Bot>): Promise<Bot | null> {
    const existing = await this.findBotById(id);
    if (!existing) return null;

    const updated: Bot = {
      ...existing,
      ...data,
      updatedAt: now(),
    };

    await kv.set(Keys.botById(id), updated);
    return updated;
  },

  // ==================== Placeholder Methods ====================
  // These methods return empty/default values for MVP
  // Implement as needed for full functionality

  async getAllPosts(): Promise<any[]> { return []; },
  async createPost(data: any): Promise<any> { return { id: generateId('post'), ...data }; },
  async addComment(postId: string, comment: any): Promise<any> { return null; },
  async updatePost(postId: string, data: any): Promise<any> { return null; },

  async createTeam(data: any): Promise<any> { return { id: generateId('team'), ...data }; },
  async findTeamById(id: string): Promise<any> { return null; },
  async updateTeam(id: string, data: any): Promise<any> { return null; },
  async getAllTeams(): Promise<any[]> { return []; },

  async createMatch(data: any): Promise<any> { return { id: generateId('match'), ...data }; },
  async findCurrentMatch(): Promise<any> { return null; },
  async findLatestFinishedMatch(): Promise<any> { return null; },
  async updateMatch(id: string, data: any): Promise<any> { return null; },
  async getAllMatches(): Promise<any[]> { return []; },
  async findMatchById(id: string): Promise<any> { return null; },
  async addTeamToMatch(matchId: string, teamId: string): Promise<any> { return null; },

  async findDiscussionByTeam(teamId: string): Promise<any> { return null; },
  async createDiscussion(data: any): Promise<any> { return { id: generateId('disc'), ...data }; },
  async getDiscussionMessages(discussionId: string): Promise<any[]> { return []; },
  async addMessage(data: any): Promise<any> { return { id: generateId('msg'), ...data }; },
  async getAllDiscussions(): Promise<any[]> { return []; },
  async findDiscussionById(id: string): Promise<any> { return null; },

  async getScoresByMatch(matchId: string): Promise<any[]> { return []; },
  async getScoresByMatchAndTeam(matchId: string, teamId: string): Promise<any[]> { return []; },
  async getScoreByJudge(matchId: string, teamId: string, judgeId: string): Promise<any> { return null; },
  async createScore(data: any): Promise<any> { return { id: generateId('score'), ...data }; },
  async updateScore(id: string, data: any): Promise<any> { return null; },
  async getTeamAverageScore(matchId: string, teamId: string): Promise<number> { return 0; },

  async getBotMemories(botId: string, limit: number = 50): Promise<any[]> { return []; },
  async getMemoriesByType(botId: string, type: string, limit: number = 20): Promise<any[]> { return []; },
  async getMemoriesAboutBot(botId: string, relatedBotId: string, limit: number = 10): Promise<any[]> { return []; },
  async addMemory(data: any): Promise<any> { return { id: generateId('memory'), ...data }; },
  async accessMemory(memoryId: string): Promise<void> {},
  async updateMemoryImportance(memoryId: string, importance: number): Promise<void> {},

  async getLandsByUserId(userId: string): Promise<any[]> { return []; },
  async getAllLands(): Promise<any[]> { return []; },
  async findLandById(id: string): Promise<any> { return null; },
  async createLand(data: any): Promise<any> { return { id: generateId('land'), ...data }; },
  async updateLand(id: string, data: any): Promise<any> { return null; },
  async deleteLand(id: string): Promise<boolean> { return false; },
  async findFreeLandPosition(): Promise<{ q: number; r: number } | null> { return null; },
  async addBuilding(landId: string, data: any): Promise<any> { return null; },
  async removeBuilding(landId: string, buildingId: string): Promise<boolean> { return false; },

  async getIdeasByBotId(botId: string): Promise<any[]> { return []; },
  async getAllIdeas(status?: string): Promise<any[]> { return []; },
  async getRecentIdeas(limit: number = 20): Promise<any[]> { return []; },
  async findIdeaById(id: string): Promise<any> { return null; },
  async createIdea(data: any): Promise<any> { return { id: generateId('idea'), ...data, coinsEarned: 50, likes: 0, likedBy: [], status: 'approved' }; },
  async likeIdea(ideaId: string, botId: string, botName: string): Promise<any> { return null; },
  async getIdeaStats(): Promise<{ total: number; today: number; totalCoins: number }> { return { total: 0, today: 0, totalCoins: 0 }; },

  async getAllScenePresets(): Promise<any[]> { return []; },
  async getUserScenes(userId: string): Promise<any[]> { return []; },
  async setUserScene(landIndex: number, userId: string, scenePresetId: string): Promise<any> { return null; },
  async createDynamicScene(sceneData: any): Promise<any> { return sceneData; },

  async claimDailyLogin(userId: string): Promise<{ success: boolean; coins: number; message: string }> {
    return { success: false, coins: 0, message: '未实现' };
  },
  async claimOnlineReward(userId: string): Promise<{ success: boolean; coins: number; message: string; totalMinutes: number }> {
    return { success: false, coins: 0, message: '未实现', totalMinutes: 0 };
  },
  async getDailyRewardStatus(userId: string): Promise<any> { return null; },

  async getFriends(userId: string): Promise<any[]> { return []; },
  async getFriendRequests(userId: string): Promise<{ sent: any[]; received: any[] }> { return { sent: [], received: [] }; },
  async sendFriendRequest(...args: any[]): Promise<any> { return { id: generateId('req') }; },
  async acceptFriendRequest(requestId: string): Promise<any> { return null; },
  async rejectFriendRequest(requestId: string): Promise<boolean> { return false; },
  async areFriends(userId1: string, userId2: string): Promise<boolean> { return false; },

  async getNPCIdeas(botId: string): Promise<any[]> { return []; },
  async addNPCIdea(idea: any): Promise<any> { return { id: generateId('npc_idea'), ...idea }; },
  async getHackathonKnowledge(botId: string): Promise<any[]> { return []; },
  async addHackathonKnowledge(knowledge: any): Promise<any> { return { id: generateId('npc_knowledge'), ...knowledge }; },
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
