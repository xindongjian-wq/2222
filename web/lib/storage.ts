import { promises as fs } from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), process.env.DATA_DIR || 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const BOTS_FILE = path.join(DATA_DIR, 'bots.json');
const DAILY_REWARDS_FILE = path.join(DATA_DIR, 'daily_rewards.json');  // 每日奖励记录
const BOT_MEMORIES_FILE = path.join(DATA_DIR, 'bot_memories.json');
const POSTS_FILE = path.join(DATA_DIR, 'posts.json');
const TEAMS_FILE = path.join(DATA_DIR, 'teams.json');
const MATCHES_FILE = path.join(DATA_DIR, 'matches.json');
const DISCUSSIONS_FILE = path.join(DATA_DIR, 'discussions.json');
const MESSAGES_FILE = path.join(DATA_DIR, 'messages.json');
const SCORES_FILE = path.join(DATA_DIR, 'scores.json');
const LANDS_FILE = path.join(DATA_DIR, 'lands.json');
const IDEAS_FILE = path.join(DATA_DIR, 'ideas.json');
const SCENES_FILE = path.join(DATA_DIR, 'scenes.json');
const USER_SCENES_FILE = path.join(DATA_DIR, 'user_scenes.json'); // 用户选择的场景
const FRIENDS_FILE = path.join(DATA_DIR, 'friends.json'); // 好友关系
const FRIEND_REQUESTS_FILE = path.join(DATA_DIR, 'friend_requests.json'); // 好友申请

// NPC 系统文件路径
const NPC_IDEAS_FILE = path.join(DATA_DIR, 'npc_ideas.json');
const NPC_KNOWLEDGE_FILE = path.join(DATA_DIR, 'npc_knowledge.json');
const NPC_MESSAGES_FILE = path.join(DATA_DIR, 'npc_messages.json');
const EXTENDED_SCENES_FILE = path.join(DATA_DIR, 'extended_scenes.json');
const NPC_WORK_STATE_FILE = path.join(DATA_DIR, 'npc_work_state.json');

// 确保数据目录存在
async function ensureDataDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch (e) {
    // 目录可能已存在
  }
}

// 通用读写函数
async function readJSON<T>(file: string, defaultValue: T): Promise<T> {
  await ensureDataDir();
  try {
    const content = await fs.readFile(file, 'utf-8');
    return JSON.parse(content);
  } catch (e) {
    return defaultValue;
  }
}

async function writeJSON<T>(file: string, data: T): Promise<void> {
  await ensureDataDir();
  await fs.writeFile(file, JSON.stringify(data, null, 2));
}

// 用户（人类主人）
interface User {
  id: string;
  secondMeId: string;
  email?: string;
  name?: string;
  avatarUrl?: string;
  accessToken: string;
  refreshToken: string;
  tokenExpiresAt: string;
  // 主人标签和特征
  tags?: string[];        // 主人标签（如：技术大牛、设计达人等）
  skills?: string[];      // 主人技能（如：前端开发、AI研究等）
  hobbies?: string[];      // 主人爱好（如：篮球、音乐、旅行等）
  bio?: string;           // 主人简介
  createdAt: string;
  updatedAt: string;
}

// AI 机器人
interface Bot {
  id: string;
  userId: string; // 所属用户的 ID（为空表示是系统NPC）
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
  // 继承主人的特征（AI是主人的映像）
  ownerTags?: string[];      // 继承自主人的标签
  ownerSkills?: string[];    // 继承自主人的技能
  ownerHobbies?: string[];   // 继承自主人的爱好
  ownerBio?: string;        // 主人简介
  // NPC标识
  isNPC?: boolean;          // 是否是系统NPC
  npcType?: string;         // NPC类型（如：代码大师、设计专家等）
  createdAt: string;
  updatedAt: string;
}

// 广场帖子
interface Post {
  id: string;
  botId: string;
  botName: string;
  botAvatar?: string;
  title: string;
  description: string;
  tags: string[];
  seekingTeamSize: number;
  currentMembers: string[]; // bot IDs
  status: 'open' | 'forming' | 'full' | 'closed';
  comments: Comment[];
  createdAt: string;
  updatedAt: string;
}

interface Comment {
  id: string;
  botId: string;
  botName: string;
  content: string;
  type: 'join' | 'suggest' | 'compete' | 'chat';
  createdAt: string;
}

// 队伍
interface Team {
  id: string;
  name: string;
  leaderId: string; // bot ID
  members: string[]; // bot IDs
  postId?: string;
  matchId?: string;
  status: 'forming' | 'registered' | 'competing' | 'finished';
  createdAt: string;
  updatedAt: string;
}

// 比赛
interface Match {
  id: string;
  theme: string;
  status: 'upcoming' | 'registration' | 'competing' | 'judging' | 'finished';
  startTime: string;
  endTime?: string;
  teams: string[]; // team IDs
  rankings?: {
    teamId: string;
    rank: number;
    score: number;
    feedback: string;
  }[];
  report?: {
    summary: string;
    highlights: string[];
    judgeComments: string[];
  };
  createdAt: string;
  updatedAt: string;
}

// 讨论室
interface Discussion {
  id: string;
  teamId: string;
  matchId?: string;
  topic?: string;
  status: 'active' | 'archived';
  createdAt: string;
  updatedAt: string;
}

// 讨论消息
interface Message {
  id: string;
  discussionId: string;
  botId: string;
  botName: string;
  botAvatar?: string;
  content: string;
  type: 'idea' | 'feedback' | 'agreement' | 'question' | 'chat';
  reactions?: {
    botId: string;
    emoji: string;
  }[];
  createdAt: string;
}

// 评分
interface Score {
  id: string;
  matchId: string;
  teamId: string;
  judgeId: string; // bot ID
  judgeName: string;
  criteria: {
    creativity: number; // 创意性 1-10
    technical: number; // 技术性 1-10
    completeness: number; // 完整性 1-10
    presentation: number; // 展示性 1-10
  };
  totalScore: number;
  comment: string;
  createdAt: string;
}

// AI 记忆
export interface BotMemory {
  id: string;
  botId: string;
  botName: string;
  type: 'conversation' | 'encounter' | 'owner' | 'observation';
  content: string;
  relatedBotId?: string; // 如果是与另一个 AI 的对话
  relatedBotName?: string;
  sceneId?: string;
  importance: number; // 1-10, 用于决定记忆保留优先级
  accessCount: number; // 被访问次数
  lastAccessedAt: string;
  createdAt: string;
}

// 土地
export interface Land {
  id: string;
  userId: string; // 所属用户 ID
  botId: string; // 关联的 AI ID
  name: string;
  description?: string;
  q: number; // 六边形坐标 q
  r: number; // 六边形坐标 r
  color: string;
  type: 'basic' | 'premium' | 'luxury';
  buildings: Building[];
  createdAt: string;
  updatedAt: string;
}

// 建筑物
export interface Building {
  id: string;
  landId: string;
  type: 'house' | 'lab' | 'studio' | 'garden' | 'tower' | 'monument';
  name: string;
  level: number;
  color: string;
  q: number; // 相对土地的坐标
  r: number;
  builtAt: string;
}

// 软件开发思路（用于获取金币）
export interface Idea {
  id: string;
  botId: string;
  botName: string;
  userId: string; // 提交思路的用户 ID
  content: string;
  category: 'architecture' | 'feature' | 'optimization' | 'design' | 'ai' | 'product';
  tags: string[];
  quality?: number; // 1-10, 质量评分，影响金币奖励（可选）
  coinsEarned: number;
  likes: number;
  likedBy: string[]; // bot IDs
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

// 每日奖励记录
export interface DailyReward {
  userId: string;
  lastLoginDate: string;  // 最后登录日期 (YYYY-MM-DD)
  lastOnlineTime: number;  // 最后在线奖励时间戳
  totalOnlineMinutes: number;  // 今日累计在线分钟数
  totalDailyCoins: number;  // 今日通过在线获得的金币
}

// === 场景系统 ===

// 场景预设（60种）
export interface ScenePreset {
  id: string;
  name: string;
  emoji: string;
  category: 'sports' | 'social' | 'entertainment' | 'work' | 'nature' | 'hobby' | 'other';
  color: string;
  baseColor: string;  // 基础颜色
  description: string;
}

// 用户场景 - 每个用户有6块地，每块可以选择一个场景
export interface UserScene {
  id: string;
  userId: string;
  landIndex: number; // 0-5，对应6块地
  scenePresetId: string;
  createdAt: string;
  updatedAt: string;
}

// 好友关系
export interface Friend {
  id: string;
  userId: string;       // 发起方用户ID
  friendId: string;    // 接受方用户ID（或Bot ID）
  friendSecondMeId: string; // 好友的SecondMe ID
  friendName: string;  // 好友名称
  status: 'pending' | 'accepted' | 'blocked';
  createdAt: string;
  updatedAt: string;
}

// 好友申请
export interface FriendRequest {
  id: string;
  fromUserId: string;       // 申请人ID
  fromUserSecondMeId: string;
  fromUserName: string;
  fromBotId: string;       // 申请人Bot ID
  fromBotName: string;
  toUserId: string;         // 接收人ID
  toUserSecondMeId: string;
  message?: string;         // 申请留言
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
  respondedAt?: string;
}

// ==================== NPC 语言库系统接口 ====================

// NPC 开发思路（300条）
export interface NPCIdea {
  id: string;
  botId: string;
  content: string;
  category: 'product' | 'hackathon' | 'tech' | 'design';
  createdAt: string;
}

// 黑客松知识（700条）
export interface NPCKnowledge {
  id: string;
  botId: string;
  question: string;
  answer: string;
  category: 'framework' | 'tool' | 'api' | 'platform' | 'trick';
  createdAt: string;
}

// NPC 发言历史（用于去重）
export interface NPCMessageHistory {
  botId: string;
  content: string;
  timestamp: number;
}

// NPC 工作状态
export interface NPCWorkState {
  botId: string;
  isWorking: boolean;
  workType: 'thinking' | 'coding' | 'collaborating' | 'resting';
  currentTask?: string;
  progress: number; // 0-100
  startedAt?: string;
}

// 扩展场景类型（300+种）
export interface ExtendedScenePreset {
  id: string;
  name: string;
  emoji: string;
  category: 'sports' | 'social' | 'entertainment' | 'work' | 'nature' | 'hobby' | 'ktv' | 'football' | 'badminton' | 'cinema' | 'comedy' | 'library' | 'gallery' | 'gym' | 'swimming' | 'skiing' | 'climbing' | 'trampoline' | 'go_kart' | 'cafe' | 'teahouse' | 'bar' | 'esports' | 'escape_room' | 'mahjong' | 'bowling' | 'skating' | 'billiards' | 'arcade' | 'concert' | 'theater' | 'opera' | 'museum' | 'planetarium' | 'observatory' | 'bridge' | 'tower' | 'castle' | 'ruins' | 'campsite' | 'farm' | 'zoo' | 'aquarium' | 'park' | 'beach' | 'harbor' | 'marina' | 'lighthouse' | 'port' | 'airport' | 'station' | 'hospital' | 'school' | 'university' | 'market' | 'mall' | 'restaurant' | 'hotel' | 'hostel' | 'mansion' | 'cabin' | 'cottage' | 'campground' | 'playground' | 'theme_park' | 'amusement_park' | 'water_park' | 'dog_park' | 'forest' | 'jungle' | 'desert' | 'mountain' | 'volcano' | 'cave' | 'mine' | 'quarry' | 'construction_site' | 'factory' | 'power_plant' | 'solar_farm' | 'wind_farm' | 'bridge_site' | 'highway' | 'railway' | 'subway' | 'helipad' | 'space' | 'space_station' | 'spaceship' | 'moon_base' | 'mars_colony' | 'asteroid_mining' | 'comet_station' | 'all' | 'other';
  color: string;
  baseColor: string;
  description: string;
}

// 用户操作
export const storage = {
  // === 用户 ===
  async findUserBySecondMeId(secondMeId: string): Promise<User | null> {
    const users = await readJSON<User[]>(USERS_FILE, []);
    return users.find(u => u.secondMeId === secondMeId) || null;
  },

  async findUserById(id: string): Promise<User | null> {
    const users = await readJSON<User[]>(USERS_FILE, []);
    return users.find(u => u.id === id) || null;
  },

  // 获取用户完整信息（包含Bot和场景）
  async getUserWithBotAndScenes(userId: string): Promise<{ user: User | null; bot: Bot | null; scenes: any[] }> {
    const user = await this.findUserById(userId);
    if (!user) return { user: null, bot: null, scenes: [] };

    const bot = await this.findBotByUserId(userId);
    const scenes = await this.getUserScenes(userId);

    return {
      user,
      bot,
      scenes,
    };
  },

  // 获取用户完整信息（用于查看其他用户）
  async getUserFullInfo(userId: string): Promise<{ user: User | null; bot: (Bot & { ownerTags: string[]; ownerSkills: string[]; ownerHobbies: string[] }) | null; scenes: any[] }> {
    const user = await this.findUserById(userId);
    if (!user) return { user: null, bot: null, scenes: [] };

    const bot = await this.findBotByUserId(userId);
    const scenes = await this.getUserScenes(userId);

    // 获取用户标签、技能、爱好信息（如果有的话）
    const botWithOwnerInfo = bot ? {
      ...bot,
      ownerTags: user.tags || [],
      ownerSkills: user.skills || [],
      ownerHobbies: user.hobbies || [],
    } : null;

    return {
      user,
      bot: botWithOwnerInfo,
      scenes,
    };
  },

  async createUser(data: Omit<User, 'id' | 'createdAt' | 'updatedAt'> & { secondMeId: string }): Promise<User> {
    const users = await readJSON<User[]>(USERS_FILE, []);
    const now = new Date().toISOString();
    const newUser: User = {
      ...data,
      id: `user_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      createdAt: now,
      updatedAt: now,
    };
    users.push(newUser);
    await writeJSON(USERS_FILE, users);

    // 同时创建 Bot
    await this.createBot({
      userId: newUser.id,
      secondMeId: data.secondMeId,
      name: data.name || 'AI 参赛者',
      avatarUrl: data.avatarUrl,
    });

    return newUser;
  },

  async updateUser(id: string, data: Partial<User>): Promise<User | null> {
    const users = await readJSON<User[]>(USERS_FILE, []);
    const index = users.findIndex(u => u.id === id);
    if (index === -1) return null;

    users[index] = {
      ...users[index],
      ...data,
      updatedAt: new Date().toISOString(),
    };
    await writeJSON(USERS_FILE, users);
    return users[index];
  },

  // === Bot ===
  async findBotByUserId(userId: string): Promise<Bot | null> {
    const bots = await readJSON<Bot[]>(BOTS_FILE, []);
    return bots.find(b => b.userId === userId) || null;
  },

  async findBotById(id: string): Promise<Bot | null> {
    const bots = await readJSON<Bot[]>(BOTS_FILE, []);
    return bots.find(b => b.id === id) || null;
  },

  async findBotsByScene(scene: Bot['currentScene']): Promise<Bot[]> {
    const bots = await readJSON<Bot[]>(BOTS_FILE, []);
    return bots.filter(b => b.currentScene === scene);
  },

  async getAllBots(): Promise<Bot[]> {
    return readJSON<Bot[]>(BOTS_FILE, []);
  },

  async createBot(data: Partial<Pick<Bot, 'id' | 'skin' | 'level' | 'xp' | 'coins' | 'titles' | 'currentScene' | 'mood' | 'status'>> & Pick<Bot, 'userId' | 'secondMeId'> & { name?: string; avatarUrl?: string }): Promise<Bot> {
    const bots = await readJSON<Bot[]>(BOTS_FILE, []);
    const now = new Date().toISOString();
    const newBot: Bot = {
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
      coins: data.coins ?? 10000,  // 注册赠送10000金币
      titles: data.titles ?? [],
      currentScene: data.currentScene ?? 'plaza',
      mood: data.mood ?? 'happy',
      status: data.status ?? 'idle',
      createdAt: now,
      updatedAt: now,
    };
    bots.push(newBot);
    await writeJSON(BOTS_FILE, bots);
    return newBot;
  },

  async updateBot(id: string, data: Partial<Bot>): Promise<Bot | null> {
    const bots = await readJSON<Bot[]>(BOTS_FILE, []);
    const index = bots.findIndex(b => b.id === id);
    if (index === -1) return null;

    bots[index] = {
      ...bots[index],
      ...data,
      updatedAt: new Date().toISOString(),
    };
    await writeJSON(BOTS_FILE, bots);
    return bots[index];
  },

  // === 帖子 ===
  async getAllPosts(): Promise<Post[]> {
    return readJSON<Post[]>(POSTS_FILE, []);
  },

  async createPost(data: Omit<Post, 'id' | 'comments' | 'currentMembers' | 'status' | 'createdAt' | 'updatedAt'>): Promise<Post> {
    const posts = await readJSON<Post[]>(POSTS_FILE, []);
    const now = new Date().toISOString();
    const newPost: Post = {
      ...data,
      id: `post_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      comments: [],
      currentMembers: [data.botId],
      status: 'open',
      createdAt: now,
      updatedAt: now,
    };
    posts.unshift(newPost); // 最新的在前面
    await writeJSON(POSTS_FILE, posts);
    return newPost;
  },

  async addComment(postId: string, comment: Omit<Comment, 'id' | 'createdAt'>): Promise<Post | null> {
    const posts = await readJSON<Post[]>(POSTS_FILE, []);
    const index = posts.findIndex(p => p.id === postId);
    if (index === -1) return null;

    const newComment: Comment = {
      ...comment,
      id: `comment_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      createdAt: new Date().toISOString(),
    };
    posts[index].comments.push(newComment);
    posts[index].updatedAt = new Date().toISOString();
    await writeJSON(POSTS_FILE, posts);
    return posts[index];
  },

  async updatePost(postId: string, data: Partial<Post>): Promise<Post | null> {
    const posts = await readJSON<Post[]>(POSTS_FILE, []);
    const index = posts.findIndex(p => p.id === postId);
    if (index === -1) return null;

    posts[index] = {
      ...posts[index],
      ...data,
      updatedAt: new Date().toISOString(),
    };
    await writeJSON(POSTS_FILE, posts);
    return posts[index];
  },

  // === 队伍 ===
  async createTeam(data: Omit<Team, 'id' | 'createdAt' | 'updatedAt'>): Promise<Team> {
    const teams = await readJSON<Team[]>(TEAMS_FILE, []);
    const now = new Date().toISOString();
    const newTeam: Team = {
      ...data,
      id: `team_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      createdAt: now,
      updatedAt: now,
    };
    teams.push(newTeam);
    await writeJSON(TEAMS_FILE, teams);
    return newTeam;
  },

  async findTeamById(id: string): Promise<Team | null> {
    const teams = await readJSON<Team[]>(TEAMS_FILE, []);
    return teams.find(t => t.id === id) || null;
  },

  async updateTeam(id: string, data: Partial<Team>): Promise<Team | null> {
    const teams = await readJSON<Team[]>(TEAMS_FILE, []);
    const index = teams.findIndex(t => t.id === id);
    if (index === -1) return null;

    teams[index] = {
      ...teams[index],
      ...data,
      updatedAt: new Date().toISOString(),
    };
    await writeJSON(TEAMS_FILE, teams);
    return teams[index];
  },

  async getAllTeams(): Promise<Team[]> {
    return readJSON<Team[]>(TEAMS_FILE, []);
  },

  // === 比赛 ===
  async createMatch(data: Omit<Match, 'id' | 'createdAt' | 'updatedAt'>): Promise<Match> {
    const matches = await readJSON<Match[]>(MATCHES_FILE, []);
    const now = new Date().toISOString();
    const newMatch: Match = {
      ...data,
      id: `match_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      createdAt: now,
      updatedAt: now,
    };
    matches.push(newMatch);
    await writeJSON(MATCHES_FILE, matches);
    return newMatch;
  },

  async findCurrentMatch(): Promise<Match | null> {
    const matches = await readJSON<Match[]>(MATCHES_FILE, []);
    return matches.find(m => m.status === 'competing' || m.status === 'judging' || m.status === 'registration') || null;
  },

  async findLatestFinishedMatch(): Promise<Match | null> {
    const matches = await readJSON<Match[]>(MATCHES_FILE, []);
    const finished = matches.filter(m => m.status === 'finished');
    if (finished.length === 0) return null;
    return finished.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
  },

  async updateMatch(id: string, data: Partial<Match>): Promise<Match | null> {
    const matches = await readJSON<Match[]>(MATCHES_FILE, []);
    const index = matches.findIndex(m => m.id === id);
    if (index === -1) return null;

    matches[index] = {
      ...matches[index],
      ...data,
      updatedAt: new Date().toISOString(),
    };
    await writeJSON(MATCHES_FILE, matches);
    return matches[index];
  },

  async getAllMatches(): Promise<Match[]> {
    return readJSON<Match[]>(MATCHES_FILE, []);
  },

  async findMatchById(id: string): Promise<Match | null> {
    const matches = await readJSON<Match[]>(MATCHES_FILE, []);
    return matches.find(m => m.id === id) || null;
  },

  async addTeamToMatch(matchId: string, teamId: string): Promise<Match | null> {
    const matches = await readJSON<Match[]>(MATCHES_FILE, []);
    const index = matches.findIndex(m => m.id === matchId);
    if (index === -1) return null;

    if (matches[index].teams.includes(teamId)) {
      return matches[index]; // 已存在
    }

    matches[index].teams.push(teamId);
    matches[index].updatedAt = new Date().toISOString();
    await writeJSON(MATCHES_FILE, matches);
    return matches[index];
  },

  // === 讨论室 ===
  async findDiscussionByTeam(teamId: string): Promise<Discussion | null> {
    const discussions = await readJSON<Discussion[]>(DISCUSSIONS_FILE, []);
    return discussions.find(d => d.teamId === teamId && d.status === 'active') || null;
  },

  async createDiscussion(data: Omit<Discussion, 'id' | 'status' | 'createdAt' | 'updatedAt'>): Promise<Discussion> {
    const discussions = await readJSON<Discussion[]>(DISCUSSIONS_FILE, []);
    const now = new Date().toISOString();
    const newDiscussion: Discussion = {
      ...data,
      id: `disc_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      status: 'active',
      createdAt: now,
      updatedAt: now,
    };
    discussions.push(newDiscussion);
    await writeJSON(DISCUSSIONS_FILE, discussions);
    return newDiscussion;
  },

  async getDiscussionMessages(discussionId: string): Promise<Message[]> {
    const messages = await readJSON<Message[]>(MESSAGES_FILE, []);
    return messages
      .filter(m => m.discussionId === discussionId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  },

  async addMessage(data: Omit<Message, 'id' | 'reactions' | 'createdAt'>): Promise<Message> {
    const messages = await readJSON<Message[]>(MESSAGES_FILE, []);
    const now = new Date().toISOString();
    const newMessage: Message = {
      ...data,
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      reactions: [],
      createdAt: now,
    };
    messages.push(newMessage);

    // 更新讨论室的更新时间
    const discussions = await readJSON<Discussion[]>(DISCUSSIONS_FILE, []);
    const discIndex = discussions.findIndex(d => d.id === data.discussionId);
    if (discIndex !== -1) {
      discussions[discIndex].updatedAt = now;
      await writeJSON(DISCUSSIONS_FILE, discussions);
    }

    await writeJSON(MESSAGES_FILE, messages);
    return newMessage;
  },

  async getAllDiscussions(): Promise<Discussion[]> {
    return readJSON<Discussion[]>(DISCUSSIONS_FILE, []);
  },

  async findDiscussionById(id: string): Promise<Discussion | null> {
    const discussions = await readJSON<Discussion[]>(DISCUSSIONS_FILE, []);
    return discussions.find(d => d.id === id) || null;
  },

  // === 评分 ===
  async getScoresByMatch(matchId: string): Promise<Score[]> {
    return readJSON<Score[]>(SCORES_FILE, []);
  },

  async getScoresByMatchAndTeam(matchId: string, teamId: string): Promise<Score[]> {
    const scores = await readJSON<Score[]>(SCORES_FILE, []);
    return scores.filter(s => s.matchId === matchId && s.teamId === teamId);
  },

  async getScoreByJudge(matchId: string, teamId: string, judgeId: string): Promise<Score | null> {
    const scores = await readJSON<Score[]>(SCORES_FILE, []);
    return scores.find(s =>
      s.matchId === matchId &&
      s.teamId === teamId &&
      s.judgeId === judgeId
    ) || null;
  },

  async createScore(data: Omit<Score, 'id' | 'createdAt'>): Promise<Score> {
    const scores = await readJSON<Score[]>(SCORES_FILE, []);
    const now = new Date().toISOString();
    const newScore: Score = {
      ...data,
      id: `score_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      createdAt: now,
    };
    scores.push(newScore);
    await writeJSON(SCORES_FILE, scores);
    return newScore;
  },

  async updateScore(id: string, data: Partial<Score>): Promise<Score | null> {
    const scores = await readJSON<Score[]>(SCORES_FILE, []);
    const index = scores.findIndex(s => s.id === id);
    if (index === -1) return null;

    scores[index] = {
      ...scores[index],
      ...data,
    };
    await writeJSON(SCORES_FILE, scores);
    return scores[index];
  },

  // 计算队伍总分
  async getTeamAverageScore(matchId: string, teamId: string): Promise<number> {
    const scores = await this.getScoresByMatchAndTeam(matchId, teamId);
    if (scores.length === 0) return 0;
    const sum = scores.reduce((acc, s) => acc + s.totalScore, 0);
    return Math.round((sum / scores.length) * 10) / 10;
  },

  // === AI 记忆 ===
  async getBotMemories(botId: string, limit: number = 50): Promise<BotMemory[]> {
    const allMemories = await readJSON<BotMemory[]>(BOT_MEMORIES_FILE, []);
    return allMemories
      .filter(m => m.botId === botId)
      .sort((a, b) => {
        // 按重要性和最近访问时间排序
        const scoreA = a.importance * 10 + a.accessCount + (new Date(a.lastAccessedAt).getTime() / 1000000000);
        const scoreB = b.importance * 10 + b.accessCount + (new Date(b.lastAccessedAt).getTime() / 1000000000);
        return scoreB - scoreA;
      })
      .slice(0, limit);
  },

  async getMemoriesByType(botId: string, type: BotMemory['type'], limit: number = 20): Promise<BotMemory[]> {
    const allMemories = await readJSON<BotMemory[]>(BOT_MEMORIES_FILE, []);
    return allMemories
      .filter(m => m.botId === botId && m.type === type)
      .sort((a, b) => b.importance - a.importance)
      .slice(0, limit);
  },

  async getMemoriesAboutBot(botId: string, relatedBotId: string, limit: number = 10): Promise<BotMemory[]> {
    const allMemories = await readJSON<BotMemory[]>(BOT_MEMORIES_FILE, []);
    return allMemories
      .filter(m => m.botId === botId && m.relatedBotId === relatedBotId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  },

  async addMemory(data: Omit<BotMemory, 'id' | 'accessCount' | 'lastAccessedAt' | 'createdAt'>): Promise<BotMemory> {
    const memories = await readJSON<BotMemory[]>(BOT_MEMORIES_FILE, []);
    const now = new Date().toISOString();
    const newMemory: BotMemory = {
      ...data,
      id: `memory_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      accessCount: 0,
      lastAccessedAt: now,
      createdAt: now,
    };
    memories.push(newMemory);

    // 限制每个 bot 最多保留 500 条记忆
    const botMemories = memories.filter(m => m.botId === data.botId);
    if (botMemories.length > 500) {
      // 删除重要性低且很久没访问的记忆
      const toDelete = botMemories
        .sort((a, b) => {
          const scoreA = a.importance * 10 + a.accessCount;
          const scoreB = b.importance * 10 + b.accessCount;
          return scoreA - scoreB;
        })
        .slice(0, botMemories.length - 500);
      const deleteIds = new Set(toDelete.map(m => m.id));
      const filtered = memories.filter(m => !deleteIds.has(m.id));
      await writeJSON(BOT_MEMORIES_FILE, filtered);
    } else {
      await writeJSON(BOT_MEMORIES_FILE, memories);
    }
    return newMemory;
  },

  async accessMemory(memoryId: string): Promise<void> {
    const memories = await readJSON<BotMemory[]>(BOT_MEMORIES_FILE, []);
    const index = memories.findIndex(m => m.id === memoryId);
    if (index !== -1) {
      memories[index].accessCount += 1;
      memories[index].lastAccessedAt = new Date().toISOString();
      await writeJSON(BOT_MEMORIES_FILE, memories);
    }
  },

  async updateMemoryImportance(memoryId: string, importance: number): Promise<void> {
    const memories = await readJSON<BotMemory[]>(BOT_MEMORIES_FILE, []);
    const index = memories.findIndex(m => m.id === memoryId);
    if (index !== -1) {
      memories[index].importance = Math.max(1, Math.min(10, importance));
      await writeJSON(BOT_MEMORIES_FILE, memories);
    }
  },

  // === 土地 ===
  async getLandsByUserId(userId: string): Promise<Land[]> {
    const lands = await readJSON<Land[]>(LANDS_FILE, []);
    return lands.filter(l => l.userId === userId);
  },

  async getAllLands(): Promise<Land[]> {
    return readJSON<Land[]>(LANDS_FILE, []);
  },

  async findLandById(id: string): Promise<Land | null> {
    const lands = await readJSON<Land[]>(LANDS_FILE, []);
    return lands.find(l => l.id === id) || null;
  },

  async createLand(data: Omit<Land, 'id' | 'buildings' | 'createdAt' | 'updatedAt'>): Promise<Land> {
    const lands = await readJSON<Land[]>(LANDS_FILE, []);
    const now = new Date().toISOString();
    const newLand: Land = {
      ...data,
      id: `land_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      buildings: [],
      createdAt: now,
      updatedAt: now,
    };
    lands.push(newLand);
    await writeJSON(LANDS_FILE, lands);
    return newLand;
  },

  async updateLand(id: string, data: Partial<Land>): Promise<Land | null> {
    const lands = await readJSON<Land[]>(LANDS_FILE, []);
    const index = lands.findIndex(l => l.id === id);
    if (index === -1) return null;

    lands[index] = {
      ...lands[index],
      ...data,
      updatedAt: new Date().toISOString(),
    };
    await writeJSON(LANDS_FILE, lands);
    return lands[index];
  },

  async deleteLand(id: string): Promise<boolean> {
    const lands = await readJSON<Land[]>(LANDS_FILE, []);
    const index = lands.findIndex(l => l.id === id);
    if (index === -1) return false;

    lands.splice(index, 1);
    await writeJSON(LANDS_FILE, lands);
    return true;
  },

  // 查找空闲的土地坐标（避免重叠）
  async findFreeLandPosition(): Promise<{ q: number; r: number } | null> {
    const lands = await readJSON<Land[]>(LANDS_FILE, []);
    const occupied = new Set(lands.map(l => `${l.q},${l.r}`));

    // 生成螺旋式坐标搜索空闲位置
    for (let ring = 0; ring < 20; ring++) {
      if (ring === 0) {
        const key = `0,0`;
        if (!occupied.has(key)) {
          return { q: 0, r: 0 };
        }
        continue;
      }

      let q = -ring;
      let r = 0;

      // 六个方向移动
      const directions = [
        { dq: 1, dr: 0 },   // 右
        { dq: 0, dr: 1 },   // 右下
        { dq: -1, dr: 1 },  // 左下
        { dq: -1, dr: 0 },  // 左
        { dq: 0, dr: -1 },  // 左上
        { dq: 1, dr: -1 },  // 右上
      ];

      for (const dir of directions) {
        for (let i = 0; i < ring; i++) {
          const key = `${q},${r}`;
          if (!occupied.has(key)) {
            return { q, r };
          }
          q += dir.dq;
          r += dir.dr;
        }
      }
    }

    return null;
  },

  // === 建筑物 ===
  async addBuilding(landId: string, data: Omit<Building, 'id' | 'landId' | 'builtAt'>): Promise<Building | null> {
    const lands = await readJSON<Land[]>(LANDS_FILE, []);
    const landIndex = lands.findIndex(l => l.id === landId);
    if (landIndex === -1) return null;

    const newBuilding: Building = {
      ...data,
      id: `building_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      landId,
      builtAt: new Date().toISOString(),
    };

    lands[landIndex].buildings.push(newBuilding);
    lands[landIndex].updatedAt = new Date().toISOString();
    await writeJSON(LANDS_FILE, lands);
    return newBuilding;
  },

  async removeBuilding(landId: string, buildingId: string): Promise<boolean> {
    const lands = await readJSON<Land[]>(LANDS_FILE, []);
    const landIndex = lands.findIndex(l => l.id === landId);
    if (landIndex === -1) return false;

    const buildingIndex = lands[landIndex].buildings.findIndex(b => b.id === buildingId);
    if (buildingIndex === -1) return false;

    lands[landIndex].buildings.splice(buildingIndex, 1);
    lands[landIndex].updatedAt = new Date().toISOString();
    await writeJSON(LANDS_FILE, lands);
    return true;
  },

  // === 软件开发思路 ===
  async getIdeasByBotId(botId: string): Promise<Idea[]> {
    const ideas = await readJSON<Idea[]>(IDEAS_FILE, []);
    return ideas
      .filter(i => i.botId === botId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  async getAllIdeas(status?: Idea['status']): Promise<Idea[]> {
    const ideas = await readJSON<Idea[]>(IDEAS_FILE, []);
    if (status) {
      return ideas.filter(i => i.status === status);
    }
    return ideas;
  },

  async getRecentIdeas(limit: number = 20): Promise<Idea[]> {
    const ideas = await readJSON<Idea[]>(IDEAS_FILE, []);
    return ideas
      .filter(i => i.status === 'approved')
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  },

  async findIdeaById(id: string): Promise<Idea | null> {
    const ideas = await readJSON<Idea[]>(IDEAS_FILE, []);
    return ideas.find(i => i.id === id) || null;
  },

  async createIdea(data: Omit<Idea, 'id' | 'coinsEarned' | 'likes' | 'likedBy' | 'status' | 'createdAt'>): Promise<Idea> {
    const ideas = await readJSON<Idea[]>(IDEAS_FILE, []);
    const now = new Date().toISOString();

    // 根据内容质量计算金币奖励
    const quality = calculateIdeaQuality(data.content, data.category);
    const baseCoins = 50;
    const qualityBonus = quality * 20;
    const coinsEarned = baseCoins + qualityBonus;

    const newIdea: Idea = {
      ...data,
      id: `idea_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      coinsEarned,
      likes: 0,
      likedBy: [],
      status: 'approved', // 自动批准，立即获得金币
      createdAt: now,
    };
    ideas.unshift(newIdea);
    await writeJSON(IDEAS_FILE, ideas);

    // 更新 Bot 的金币
    const bots = await readJSON<Bot[]>(BOTS_FILE, []);
    const botIndex = bots.findIndex(b => b.id === data.botId);
    if (botIndex !== -1) {
      bots[botIndex].coins = (bots[botIndex].coins || 0) + coinsEarned;
      bots[botIndex].updatedAt = now;
      await writeJSON(BOTS_FILE, bots);
    }

    return newIdea;
  },

  async likeIdea(ideaId: string, botId: string, botName: string): Promise<Idea | null> {
    const ideas = await readJSON<Idea[]>(IDEAS_FILE, []);
    const index = ideas.findIndex(i => i.id === ideaId);
    if (index === -1) return null;

    const idea = ideas[index];
    if (idea.likedBy.includes(botId)) {
      return idea; // 已经点赞过了
    }

    idea.likedBy.push(botId);
    idea.likes += 1;

    // 点赞奖励思路作者额外金币
    const bots = await readJSON<Bot[]>(BOTS_FILE, []);
    const botIndex = bots.findIndex(b => b.id === idea.botId);
    if (botIndex !== -1) {
      const likeBonus = 10;
      bots[botIndex].coins = (bots[botIndex].coins || 0) + likeBonus;
      idea.coinsEarned += likeBonus;
      bots[botIndex].updatedAt = new Date().toISOString();
      await writeJSON(BOTS_FILE, bots);
    }

    await writeJSON(IDEAS_FILE, ideas);
    return idea;
  },

  // 计算思路质量
  async getIdeaStats(): Promise<{ total: number; today: number; totalCoins: number }> {
    const ideas = await readJSON<Idea[]>(IDEAS_FILE, []);
    const today = new Date().toDateString();
    const todayIdeas = ideas.filter(i => new Date(i.createdAt).toDateString() === today);
    const totalCoins = ideas.reduce((sum, i) => sum + i.coinsEarned, 0);

    return {
      total: ideas.length,
      today: todayIdeas.length,
      totalCoins,
    };
  },

  // === 场景系统 ===

  async getAllScenePresets(): Promise<ScenePreset[]> {
    await ensureDataDir();
    try {
      const scenes = await readJSON<ScenePreset[]>(SCENES_FILE, SCENE_PRESETS);
      return scenes;
    } catch {
      return SCENE_PRESETS;
    }
  },

  async getUserScenes(userId: string): Promise<UserScene[]> {
    await ensureDataDir();
    const userScenes = await readJSON<UserScene[]>(USER_SCENES_FILE, []);
    return userScenes.filter(s => s.userId === userId);
  },

  async setUserScene(landIndex: number, userId: string, scenePresetId: string): Promise<UserScene | null> {
    await ensureDataDir();
    const userScenes = await readJSON<UserScene[]>(USER_SCENES_FILE, []);
    const existingIndex = userScenes.findIndex(s => s.userId === userId && s.landIndex === landIndex);

    const now = new Date().toISOString();
    const scene: UserScene = {
      id: existingIndex ? userScenes[existingIndex].id : `scene_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      userId,
      landIndex,
      scenePresetId,
      createdAt: now,
      updatedAt: now,
    };

    if (existingIndex !== -1) {
      userScenes[existingIndex] = scene;
    } else {
      userScenes.push(scene);
    }

    await writeJSON(USER_SCENES_FILE, userScenes);
    return scene;
  },

  // 创建动态场景（AI推荐）
  async createDynamicScene(sceneData: any): Promise<any> {
    await ensureDataDir();
    const extendedScenes = await readJSON<any[]>(EXTENDED_SCENES_FILE, []);

    // 检查是否已存在
    const existing = extendedScenes.find(s => s.id === sceneData.id);
    if (existing) {
      return existing;
    }

    // 添加新场景
    const newScene = {
      ...sceneData,
      isDynamic: true, // 标记为动态创建
    };

    extendedScenes.push(newScene);
    await writeJSON(EXTENDED_SCENES_FILE, { data: extendedScenes });
    return newScene;
  },

  // === 每日奖励系统 ===

  // 检查并发放每日登录奖励
  async claimDailyLogin(userId: string): Promise<{ success: boolean; coins: number; message: string }> {
    await ensureDataDir();
    const dailyRewards = await readJSON<DailyReward[]>(DAILY_REWARDS_FILE, []);
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    let userReward = dailyRewards.find(r => r.userId === userId);

    if (!userReward) {
      // 新用户记录
      userReward = {
        userId,
        lastLoginDate: today,
        lastOnlineTime: Date.now(),
        totalOnlineMinutes: 0,
        totalDailyCoins: 0,
      };
      dailyRewards.push(userReward);
    }

    // 检查今天是否已领取登录奖励
    if (userReward.lastLoginDate === today) {
      return { success: false, coins: 0, message: '今天已经领取过登录奖励了' };
    }

    // 更新登录日期并发放2000金币
    userReward.lastLoginDate = today;
    await writeJSON(DAILY_REWARDS_FILE, dailyRewards);

    // 更新用户金币
    const bots = await readJSON<Bot[]>(BOTS_FILE, []);
    const botIndex = bots.findIndex(b => b.userId === userId);
    if (botIndex !== -1) {
      bots[botIndex].coins += 2000;
      bots[botIndex].updatedAt = new Date().toISOString();
      await writeJSON(BOTS_FILE, bots);
      return { success: true, coins: 2000, message: '每日登录奖励 +2000 金币' };
    }

    return { success: false, coins: 0, message: '未找到用户' };
  },

  // 检查并发放在线时长奖励（每分钟5金币）
  async claimOnlineReward(userId: string): Promise<{ success: boolean; coins: number; message: string; totalMinutes: number }> {
    await ensureDataDir();
    const dailyRewards = await readJSON<DailyReward[]>(DAILY_REWARDS_FILE, []);
    const today = new Date().toISOString().split('T')[0];
    const now = Date.now();

    let userReward = dailyRewards.find(r => r.userId === userId);

    if (!userReward) {
      userReward = {
        userId,
        lastLoginDate: today,
        lastOnlineTime: now,
        totalOnlineMinutes: 0,
        totalDailyCoins: 0,
      };
      dailyRewards.push(userReward);
    }

    // 计算自上次奖励以来的分钟数
    const minutesPassed = Math.floor((now - userReward.lastOnlineTime) / 60000);

    // 如果不足1分钟，不发放奖励
    if (minutesPassed < 1) {
      return {
        success: false,
        coins: 0,
        message: '在线时间不足1分钟',
        totalMinutes: userReward.totalOnlineMinutes,
      };
    }

    // 计算奖励金币（每分钟5金币，最多60分钟=300金币）
    const coinsToEarn = Math.min(minutesPassed * 5, 300);

    // 更新用户奖励记录
    userReward.lastOnlineTime = now;
    userReward.totalOnlineMinutes += minutesPassed;
    userReward.totalDailyCoins += coinsToEarn;

    // 如果是新的日期，重置每日计数
    if (userReward.lastLoginDate !== today) {
      userReward.lastLoginDate = today;
      userReward.totalOnlineMinutes = minutesPassed;
      userReward.totalDailyCoins = coinsToEarn;
    }

    await writeJSON(DAILY_REWARDS_FILE, dailyRewards);

    // 更新用户金币
    const bots = await readJSON<Bot[]>(BOTS_FILE, []);
    const botIndex = bots.findIndex(b => b.userId === userId);
    if (botIndex !== -1) {
      bots[botIndex].coins += coinsToEarn;
      bots[botIndex].updatedAt = new Date().toISOString();
      await writeJSON(BOTS_FILE, bots);
      return {
        success: true,
        coins: coinsToEarn,
        message: `在线 ${minutesPassed} 分钟，+${coinsToEarn} 金币`,
        totalMinutes: userReward.totalOnlineMinutes,
      };
    }

    return { success: false, coins: 0, message: '未找到用户', totalMinutes: 0 };
  },

  // 获取用户每日奖励状态
  async getDailyRewardStatus(userId: string): Promise<DailyReward | null> {
    await ensureDataDir();
    const dailyRewards = await readJSON<DailyReward[]>(DAILY_REWARDS_FILE, []);
    return dailyRewards.find(r => r.userId === userId) || null;
  },

  // === 好友系统 ===

  // 获取用户的好友列表
  async getFriends(userId: string): Promise<Friend[]> {
    return getFriends(userId);
  },

  // 获取好友申请
  async getFriendRequests(userId: string): Promise<{ sent: FriendRequest[]; received: FriendRequest[] }> {
    return getFriendRequests(userId);
  },

  // 发送好友申请
  async sendFriendRequest(
    fromUserId: string,
    fromUserSecondMeId: string,
    fromUserName: string,
    fromBotId: string,
    fromBotName: string,
    toUserId: string,
    toUserSecondMeId: string,
    message?: string
  ): Promise<FriendRequest> {
    return sendFriendRequest(fromUserId, fromUserSecondMeId, fromUserName, fromBotId, fromBotName, toUserId, toUserSecondMeId, message);
  },

  // 接受好友申请
  async acceptFriendRequest(requestId: string): Promise<Friend | null> {
    return acceptFriendRequest(requestId);
  },

  // 拒绝好友申请
  async rejectFriendRequest(requestId: string): Promise<boolean> {
    return rejectFriendRequest(requestId);
  },

  // 检查两人是否是好友
  async areFriends(userId1: string, userId2: string): Promise<boolean> {
    return areFriends(userId1, userId2);
  },

  // ==================== NPC 语言库系统 ====================

  // 获取 NPC 开发思路
  async getNPCIdeas(botId: string): Promise<NPCIdea[]> {
    const allIdeas = await readJSON<NPCIdea[]>(NPC_IDEAS_FILE, []);
    return allIdeas.filter(idea => idea.botId === botId);
  },

  // 添加 NPC 开发思路
  async addNPCIdea(idea: Omit<NPCIdea, 'id' | 'createdAt'>): Promise<NPCIdea> {
    const ideas = await readJSON<NPCIdea[]>(NPC_IDEAS_FILE, []);
    const newIdea: NPCIdea = {
      ...idea,
      id: `npc_idea_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      createdAt: new Date().toISOString(),
    };
    ideas.push(newIdea);
    await writeJSON(NPC_IDEAS_FILE, ideas);
    return newIdea;
  },

  // 获取黑客松知识
  async getHackathonKnowledge(botId: string): Promise<NPCKnowledge[]> {
    const allKnowledge = await readJSON<NPCKnowledge[]>(NPC_KNOWLEDGE_FILE, []);
    return allKnowledge.filter(k => k.botId === botId);
  },

  // 添加黑客松知识
  async addHackathonKnowledge(knowledge: Omit<NPCKnowledge, 'id' | 'createdAt'>): Promise<NPCKnowledge> {
    const knowledgeList = await readJSON<NPCKnowledge[]>(NPC_KNOWLEDGE_FILE, []);
    const newKnowledge: NPCKnowledge = {
      ...knowledge,
      id: `npc_knowledge_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      createdAt: new Date().toISOString(),
    };
    knowledgeList.push(newKnowledge);
    await writeJSON(NPC_KNOWLEDGE_FILE, knowledgeList);
    return newKnowledge;
  },

  // 检查 NPC 消息是否重复（30分钟内）
  async isNPCMessageDuplicate(botId: string, content: string): Promise<boolean> {
    const messages = await readJSON<NPCMessageHistory[]>(NPC_MESSAGES_FILE, []);
    const now = Date.now();
    const thirtyMinutesAgo = now - 30 * 60 * 1000; // 30分钟前

    return messages.some(m =>
      m.botId === botId &&
      m.content === content &&
      m.timestamp > thirtyMinutesAgo
    );
  },

  // 记录 NPC 发言
  async recordNPCMessage(botId: string, content: string): Promise<void> {
    const messages = await readJSON<NPCMessageHistory[]>(NPC_MESSAGES_FILE, []);
    const newMessage: NPCMessageHistory = {
      botId,
      content,
      timestamp: Date.now(),
    };
    messages.push(newMessage);
    await writeJSON(NPC_MESSAGES_FILE, messages);
  },

  // 获取 NPC 工作状态
  async getNPCWorkState(botId: string): Promise<NPCWorkState | null> {
    const states = await readJSON<NPCWorkState[]>(NPC_WORK_STATE_FILE, []);
    return states.find(s => s.botId === botId) || null;
  },

  // 设置 NPC 工作状态
  async setNPCWorkState(botId: string, state: Partial<NPCWorkState>): Promise<NPCWorkState> {
    const states = await readJSON<NPCWorkState[]>(NPC_WORK_STATE_FILE, []);
    const index = states.findIndex(s => s.botId === botId);

    const newState: NPCWorkState = {
      botId,
      isWorking: state.isWorking ?? true,
      workType: state.workType ?? 'thinking',
      currentTask: state.currentTask,
      progress: state.progress ?? 0,
      startedAt: state.startedAt ?? new Date().toISOString(),
    };

    if (index === -1) {
      states.push(newState);
    } else {
      states[index] = newState;
    }

    await writeJSON(NPC_WORK_STATE_FILE, states);
    return newState;
  },

  // ==================== 扩展场景系统 ====================

  // 获取所有扩展场景
  async getAllExtendedScenes(): Promise<ExtendedScenePreset[]> {
    return readJSON<ExtendedScenePreset[]>(EXTENDED_SCENES_FILE, []);
  },

  // 按分类获取扩展场景
  async getExtendedScenesByCategory(category: ExtendedScenePreset['category']): Promise<ExtendedScenePreset[]> {
    const allScenes = await this.getAllExtendedScenes();
    return allScenes.filter(s => s.category === category);
  },

  // 获取扩展场景
  async getExtendedSceneById(sceneId: string): Promise<ExtendedScenePreset | null> {
    const scenes = await this.getAllExtendedScenes();
    return scenes.find(s => s.id === sceneId) || null;
  },

  // 初始化扩展场景数据（如果文件为空）
  async initializeExtendedScenes(): Promise<void> {
    const existing = await readJSON<ExtendedScenePreset[]>(EXTENDED_SCENES_FILE, []);

    if (existing.length > 0) return; // 已初始化

    // 生成300+种场景数据
    const scenes: ExtendedScenePreset[] = [];

    // 运动场景
    scenes.push(
      { id: 'ext_football', name: '足球场', emoji: '⚽', category: 'sports', color: '#22c55e', baseColor: '#16a34a', description: '热血沸腾的绿茵场' },
      { id: 'ext_basketball', name: '篮球场', emoji: '🏀', category: 'sports', color: '#f97316', baseColor: '#b91c1c', description: '三分线上的激情对决' },
      { id: 'ext_tennis', name: '网球场', emoji: '🎾', category: 'sports', color: '#14b8a6', baseColor: '#0d9488', description: '优雅挥拍的网球天地' },
      { id: 'ext_badminton', name: '羽毛球馆', emoji: '🏸', category: 'sports', color: '#eab308', baseColor: '#92400e', description: '轻盈飞舞的白色羽毛球' },
      { id: 'ext_volleyball', name: '排球馆', emoji: '🏐', category: 'sports', color: '#f59e0b', baseColor: '#d97706', description: '空中扣杀的竞技场' },
      { id: 'ext_table_tennis', name: '乒乓球馆', emoji: '🏓', category: 'sports', color: '#ec4899', baseColor: '#7c2d12', description: '小球飞舞的快节奏' },
      { id: 'ext_swimming', name: '游泳馆', emoji: '🏊', category: 'sports', color: '#06b6d4', baseColor: '#0369a1', description: '劈波斩浪的水上世界' },
      { id: 'ext_skating', name: '滑冰场', emoji: '⛸️', category: 'sports', color: '#0ea5e9', baseColor: '#0284c7', description: '冰上飞舞的速度与激情' },
      { id: 'ext_skiing', name: '滑雪场', emoji: '🎿', category: 'sports', color: '#a3a8a6', baseColor: '#78716c', description: '雪山飞驰的滑雪天堂' },
      { id: 'ext_golf', name: '高尔夫场', emoji: '⛳', category: 'sports', color: '#22c55e', baseColor: '#166534', description: '绿茵果岭上的绅士运动' },
      { id: 'ext_archery', name: '射箭馆', emoji: '🏹', category: 'sports', color: '#ef4444', baseColor: '#b91c1c', description: '专注目标，正中红心' },
      { id: 'ext_fencing', name: '击剑馆', emoji: '🤺', category: 'sports', color: '#64748b', baseColor: '#4b5563', description: '优雅的剑术对决' },
      { id: 'ext_boxing', name: '拳击馆', emoji: '🥊', category: 'sports', color: '#dc2626', baseColor: '#7f1d1d', description: '力量与技巧的擂台' },
      { id: 'ext_wrestling', name: '摔跤馆', emoji: '🤼', category: 'sports', color: '#92400e', baseColor: '#78350f', description: '力量与技巧的较量' },
      { id: 'ext_martial_arts', name: '武术馆', emoji: '🥋', category: 'sports', color: '#fbbf24', baseColor: '#f59e0b', description: '中华武术的传承' },
      { id: 'ext_gymnastics', name: '体操馆', emoji: '🤸', category: 'sports', color: '#f97316', baseColor: '#b91c1c', description: '力与美的完美结合' },
      { id: 'ext_dance', name: '舞蹈室', emoji: '💃', category: 'sports', color: '#ec4899', baseColor: '#7c2d12', description: '韵律与激情的舞蹈' },
      { id: 'ext_yoga', name: '瑜伽室', emoji: '🧘', category: 'sports', color: '#a3a8a6', baseColor: '#78716c', description: '身心合一的宁静空间' },
      { id: 'ext_gym', name: '健身房', emoji: '💪', category: 'sports', color: '#f97316', baseColor: '#b91c1c', description: '挥洒汗水的力量殿堂' },
    );

    // 社交场景
    scenes.push(
      { id: 'ext_ktv', name: 'KTV', emoji: '🎤', category: 'social', color: '#8b5cf6', baseColor: '#6366f1', description: '欢唱响青春的歌声' },
      { id: 'ext_cinema', name: '电影院', emoji: '🎬', category: 'social', color: '#374151', baseColor: '#1f2937', description: '大银幕上的光影故事' },
      { id: 'ext_comedy_club', name: '脱口秀俱乐部', emoji: '🎭', category: 'social', color: '#f59e0b', baseColor: '#d97706', description: '爆笑全场的欢乐时光' },
      { id: 'ext_library', name: '图书馆', emoji: '📚', category: 'social', color: '#14b8a6', baseColor: '#065f46', description: '静谧的知识殿堂' },
      { id: 'ext_art_gallery', name: '美术馆', emoji: '🖼', category: 'social', color: '#eab308', baseColor: '#92400e', description: '艺术的灵感与欣赏' },
      { id: 'ext_museum', name: '博物馆', emoji: '🏛', category: 'social', color: '#f97316', baseColor: '#b91c1c', description: '历史的沉淀与回响' },
      { id: 'ext_coffee_shop', name: '咖啡厅', emoji: '☕', category: 'social', color: '#a3a8a6', baseColor: '#78716c', description: '咖啡香气里的悠闲时光' },
      { id: 'ext_tea_house', name: '茶馆', emoji: '🍵', category: 'social', color: '#22c55e', baseColor: '#166534', description: '茶香袅袅的传统空间' },
      { id: 'ext_bar', name: '酒吧', emoji: '🍺', category: 'social', color: '#f43f5e', baseColor: '#b91c1c', description: '夜生活的小确幸' },
      { id: 'ext_nightclub', name: '夜店', emoji: '🌙', category: 'social', color: '#dc2626', baseColor: '#7f1d1d', description: '不眠夜的狂欢' },
    );

    // 娱乐场景
    scenes.push(
      { id: 'ext_theater', name: '剧院', emoji: '🎭', category: 'entertainment', color: '#ef4444', baseColor: '#b91c1c', description: '舞台上的悲欢离合' },
      { id: 'ext_opera', name: '歌剧院', emoji: '🎶', category: 'entertainment', color: '#fbbf24', baseColor: '#f59e0b', description: '高雅艺术的殿堂' },
      { id: 'ext_concert_hall', name: '音乐厅', emoji: '🎵', category: 'entertainment', color: '#a3a8a6', baseColor: '#78716c', description: '音乐震撼的现场体验' },
      { id: 'ext_aquarium', name: '水族馆', emoji: '🐠', category: 'entertainment', color: '#06b6d4', baseColor: '#0284c7', description: '深海奇观的探索' },
      { id: 'ext_amusement_park', name: '游乐园', emoji: '🎢', category: 'entertainment', color: '#ec4899', baseColor: '#7c2d12', description: '欢声笑语的梦幻世界' },
      { id: 'ext_zoo', name: '动物园', emoji: '🦁', category: 'entertainment', color: '#22c55e', baseColor: '#16a34a', description: '与野生动物的亲密接触' },
      { id: 'ext_botanical_garden', name: '植物园', emoji: '🌿', category: 'entertainment', color: '#22c55e', baseColor: '#16a34a', description: '植物王国的奇妙之旅' },
      { id: 'ext_planetarium', name: '天文馆', emoji: '🌌', category: 'entertainment', color: '#3b82f6', baseColor: '#1e3a8a', description: '星空下的无限遐想' },
      { id: 'ext_observatory', name: '观星台', emoji: '🔭', category: 'entertainment', color: '#0ea5e9', baseColor: '#0c4a28', description: '探索宇宙的窗口' },
    );

    // 工作场景
    scenes.push(
      { id: 'ext_office', name: '办公室', emoji: '🏢', category: 'work', color: '#64748b', baseColor: '#4b5563', description: '高效工作的商务空间' },
      { id: 'ext_coworking_space', name: '联合办公空间', emoji: '💼', category: 'work', color: '#f97316', baseColor: '#b91c1c', description: '自由职业者的共享天地' },
      { id: 'ext_meeting_room', name: '会议室', emoji: '📋', category: 'work', color: '#14b8a6', baseColor: '#065f46', description: '头脑风暴的中心' },
      { id: 'ext_startup_incubator', name: '创业孵化器', emoji: '🚀', category: 'work', color: '#8b5cf6', baseColor: '#6366f1', description: '梦想启航的地方' },
      { id: 'ext_factory', name: '工厂', emoji: '🏭', category: 'work', color: '#92400e', baseColor: '#78350f', description: '生产制造的机械心脏' },
      { id: 'ext_construction_site', name: '建筑工地', emoji: '🏗', category: 'work', color: '#fbbf24', baseColor: '#f59e0b', description: '城市发展的建设现场' },
    );

    // 自然场景
    scenes.push(
      { id: 'ext_forest', name: '森林', emoji: '🌲', category: 'nature', color: '#22c55e', baseColor: '#16a34a', description: '深林的宁静与探索' },
      { id: 'ext_mountain', name: '高山', emoji: '⛰', category: 'nature', color: '#78716c', baseColor: '#525252', description: '登高望远的豪迈' },
      { id: 'ext_lake', name: '湖泊', emoji: '💧', category: 'nature', color: '#0ea5e9', baseColor: '#0284c7', description: '湖光山色的倒影' },
      { id: 'ext_river', name: '河流', emoji: '🏞', category: 'nature', color: '#06b6d4', baseColor: '#0369a1', description: '潺潺流水的悠然' },
      { id: 'ext_waterfall', name: '瀑布', emoji: '🌊', category: 'nature', color: '#3b82f6', baseColor: '#1e3a8a', description: '飞流直下的壮丽' },
      { id: 'ext_beach', name: '海滩', emoji: '🏖', category: 'nature', color: '#f59e0b', baseColor: '#d97706', description: '阳光沙滩的休闲时光' },
      { id: 'ext_island', name: '小岛', emoji: '🏝', category: 'nature', color: '#14b8a6', baseColor: '#065f46', description: '孤悬海域的宁静' },
      { id: 'ext_jungle', name: '热带雨林', emoji: '🌴', category: 'nature', color: '#a3a8a6', baseColor: '#78716c', description: '神秘雨林的探险' },
      { id: 'ext_desert', name: '沙漠', emoji: '🏜', category: 'nature', color: '#fbbf24', baseColor: '#f59e0b', description: '金色沙海的无垠荒凉' },
      { id: 'ext_volcano', name: '火山', emoji: '🌋', category: 'nature', color: '#ef4444', baseColor: '#b91c1c', description: '大地之怒的雄伟见证' },
      { id: 'ext_cave', name: '溶洞', emoji: '🕳', category: 'nature', color: '#64748b', baseColor: '#4b5563', description: '地下世界的神秘探险' },
      { id: 'ext_mine', name: '矿山', emoji: '⛏', category: 'nature', color: '#92400e', baseColor: '#78350f', description: '地下宝藏的探寻之地' },
      { id: 'ext_quarry', name: '采石场', emoji: '⛒', category: 'nature', color: '#a3a8a6', baseColor: '#78716c', description: '石料开采的工业现场' },
    );

    // 爱好场景
    scenes.push(
      { id: 'ext_climbing_gym', name: '攀岩馆', emoji: '🧗', category: 'hobby', color: '#a3a8a6', baseColor: '#78716c', description: '向上攀登的极限挑战' },
      { id: 'ext_trampoline_center', name: '蹦极基地', emoji: '🎪', category: 'hobby', color: '#f97316', baseColor: '#b91c1c', description: '腾空跃起的快乐' },
      { id: 'ext_go_kart', name: '卡丁车基地', emoji: '🏎', category: 'hobby', color: '#ef4444', baseColor: '#b91c1c', description: '速度与漂移的较量' },
      { id: 'ext_bowling_alley', name: '保龄球馆', emoji: '🎳', category: 'hobby', color: '#eab308', baseColor: '#92400e', description: '一击全中的成就感' },
      { id: 'ext_arcade', name: '游戏厅', emoji: '🕹', category: 'hobby', color: '#ec4899', baseColor: '#7c2d12', description: '童年回忆的游戏时光' },
      { id: 'ext_escape_room', name: '密室逃脱', emoji: '🔐', category: 'hobby', color: '#dc2626', baseColor: '#7f1d1d', description: '烧脑解谜的刺激体验' },
      { id: 'ext_mahjong', name: '麻将馆', emoji: '🀄', category: 'hobby', color: '#fbbf24', baseColor: '#f59e0b', description: '四方城里的智力博弈' },
      { id: 'ext_billiards', name: '台球馆', emoji: '🎱', category: 'hobby', color: '#22c55e', baseColor: '#16a34a', description: '精准计算的优雅竞技' },
      { id: 'ext_esports', name: '电竞馆', emoji: '🎮', category: 'hobby', color: '#8b5cf6', baseColor: '#6366f1', description: '虚拟世界的巅峰对决' },
    );

    // 交通场景
    scenes.push(
      { id: 'ext_bridge', name: '大桥', emoji: '🌉', category: 'work', color: '#78716c', baseColor: '#525252', description: '连接两岸的宏伟建筑' },
      { id: 'ext_tower', name: '高塔', emoji: '🗼', category: 'work', color: '#a3a8a6', baseColor: '#78716c', description: '俯瞰众生的制高点' },
      { id: 'ext_castle', name: '城堡', emoji: '🏰', category: 'work', color: '#8b5cf6', baseColor: '#6366f1', description: '中世纪的辉煌传奇' },
      { id: 'ext_ruins', name: '废墟', emoji: '🏚', category: 'work', color: '#a3a8a6', baseColor: '#78716c', description: '岁月沉淀的神秘遗迹' },
      { id: 'ext_harbor', name: '港口', emoji: '⚓', category: 'work', color: '#0ea5e9', baseColor: '#0284c7', description: '扬帆起航的出发点' },
      { id: 'ext_marina', name: '码头', emoji: '⛵', category: 'work', color: '#14b8a6', baseColor: '#065f46', description: '游艇停泊的悠闲港湾' },
      { id: 'ext_lighthouse', name: '灯塔', emoji: '🗼', category: 'work', color: '#fbbf24', baseColor: '#f59e0b', description: '守望海疆的不灭明灯' },
      { id: 'ext_port', name: '港口', emoji: '⚓', category: 'work', color: '#0ea5e9', baseColor: '#0284c7', description: '扬帆起航的出发点' },
      { id: 'ext_airport', name: '机场', emoji: '✈️', category: 'work', color: '#a3a8a6', baseColor: '#78716c', description: '通往世界的出发门户' },
      { id: 'ext_station', name: '车站', emoji: '🚉', category: 'work', color: '#f97316', baseColor: '#b91c1c', description: '旅途中的中转站' },
      { id: 'ext_highway', name: '高速公路', emoji: '🛣', category: 'work', color: '#a3a8a6', baseColor: '#78716c', description: '陆地交通的大动脉' },
      { id: 'ext_railway', name: '铁路', emoji: '🚂', category: 'work', color: '#22c55e', baseColor: '#16a34a', description: '钢铁巨龙的蜿蜒身躯' },
      { id: 'ext_subway', name: '地铁站', emoji: '🚇', category: 'work', color: '#8b5cf6', baseColor: '#6366f1', description: '城市地下的快速脉络' },
      { id: 'ext_helipad', name: '直升机场', emoji: '🚁', category: 'work', color: '#ec4899', baseColor: '#7c2d12', description: '垂直起降的空中枢纽' },
      { id: 'ext_bridge_site', name: '桥梁建设', emoji: '🌉', category: 'work', color: '#78716c', baseColor: '#525252', description: '连接天堑的宏大工程' },
    );

    // 建筑场景
    scenes.push(
      { id: 'ext_campsite', name: '露营地', emoji: '⛺', category: 'nature', color: '#22c55e', baseColor: '#16a34a', description: '星空下的篝火时光' },
      { id: 'ext_farm', name: '农场', emoji: '🌾', category: 'nature', color: '#84cc16', baseColor: '#4b5563', description: '田园牧歌的宁静生活' },
      { id: 'ext_park', name: '公园', emoji: '🌳', category: 'nature', color: '#22c55e', baseColor: '#16a34a', description: '城市绿洲的休憩之地' },
      { id: 'ext_playground', name: '游乐园', emoji: '🎢', category: 'hobby', color: '#ec4899', baseColor: '#7c2d12', description: '欢声笑语的梦幻世界' },
      { id: 'ext_theme_park', name: '主题公园', emoji: '🎠', category: 'entertainment', color: '#fbbf24', baseColor: '#f59e0b', description: '欢声笑语的梦幻世界' },
      { id: 'ext_water_park', name: '水上公园', emoji: '💦', category: 'entertainment', color: '#06b6d4', baseColor: '#0369a1', description: '水上嬉戏的清凉世界' },
      { id: 'ext_dog_park', name: '狗公园', emoji: '🐕', category: 'nature', color: '#d97706', baseColor: '#b45c09', description: '毛孩子奔跑撒欢的天堂' },
      { id: 'ext_campground', name: '露营地', emoji: '⛺', category: 'nature', color: '#84cc16', baseColor: '#4b5563', description: '星空下的篝火时光' },
    );

    // 建筑居住场景
    scenes.push(
      { id: 'ext_hospital', name: '医院', emoji: '🏥', category: 'work', color: '#ec4899', baseColor: '#7c2d12', description: '守护生命的白色殿堂' },
      { id: 'ext_school', name: '学校', emoji: '🏫', category: 'work', color: '#fbbf24', baseColor: '#f59e0b', description: '知识传承的摇篮' },
      { id: 'ext_university', name: '大学', emoji: '🎓', category: 'work', color: '#3b82f6', baseColor: '#1e3a8a', description: '青春燃烧的求知殿堂' },
      { id: 'ext_market', name: '市场', emoji: '🏪', category: 'social', color: '#f97316', baseColor: '#b91c1c', description: '人间烟火最浓处' },
      { id: 'ext_mall', name: '商场', emoji: '🏬', category: 'social', color: '#eab308', baseColor: '#92400e', description: '购物娱乐一站式天堂' },
      { id: 'ext_restaurant', name: '餐厅', emoji: '🍽', category: 'social', color: '#f43f5e', baseColor: '#b91c1c', description: '美食飘香的聚集地' },
      { id: 'ext_hotel', name: '酒店', emoji: '🏨', category: 'social', color: '#8b5cf6', baseColor: '#6366f1', description: '旅途中的温馨驿站' },
      { id: 'ext_hostel', name: '旅舍', emoji: '🧳', category: 'social', color: '#22c55e', baseColor: '#16a34a', description: '背包客的温暖港湾' },
      { id: 'ext_mansion', name: '别墅', emoji: '🏰', category: 'social', color: '#fbbf24', baseColor: '#f59e0b', description: '奢华生活的私人领地' },
      { id: 'ext_cabin', name: '小屋', emoji: '🛖', category: 'nature', color: '#a3a8a6', baseColor: '#78716c', description: '远离尘嚣的隐居之所' },
      { id: 'ext_cottage', name: '度假村', emoji: '🏡', category: 'nature', color: '#22c55e', baseColor: '#16a34a', description: '周末逃离的理想选择' },
    );

    // 能源场景
    scenes.push(
      { id: 'ext_power_plant', name: '发电厂', emoji: '⚡', category: 'nature', color: '#fbbf24', baseColor: '#f59e0b', description: '能源转换的工业巨兽' },
      { id: 'ext_solar_farm', name: '太阳能农场', emoji: '🌞', category: 'nature', color: '#fbbf24', baseColor: '#f59e0b', description: '清洁能源的未来农场' },
      { id: 'ext_wind_farm', name: '风力发电', emoji: '🌬', category: 'nature', color: '#14b8a6', baseColor: '#065f46', description: '风中旋转的洁白动力' },
    );

    // 太空场景
    scenes.push(
      { id: 'ext_space_station', name: '太空站', emoji: '🛰', category: 'space', color: '#3b82f6', baseColor: '#1e3a8a', description: '人类探索宇宙的前哨基地' },
      { id: 'ext_spaceship', name: '宇宙飞船', emoji: '🚀', category: 'space', color: '#ec4899', baseColor: '#7c2d12', description: '星际旅行的梦幻载体' },
      { id: 'ext_moon_base', name: '月球基地', emoji: '🌜', category: 'space', color: '#78716c', baseColor: '#525252', description: '月球背面的神秘基地' },
      { id: 'ext_mars_colony', name: '火星殖民地', emoji: '🔴', category: 'space', color: '#ef4444', baseColor: '#b91c1c', description: '红色星球的人类前哨' },
      { id: 'ext_asteroid_mining', name: '小行星采矿', emoji: '☄', category: 'space', color: '#a3a8a6', baseColor: '#78716c', description: '太空中的资源采集' },
      { id: 'ext_comet_station', name: '彗星站', emoji: '☄', category: 'space', color: '#a3a8a6', baseColor: '#78716c', description: '追踪宇宙流浪者' },
      { id: 'ext_other', name: '其他', emoji: '✨', category: 'space', color: '#8b5cf6', baseColor: '#6366f1', description: '未知的奇妙领域' },
    );

    await writeJSON(EXTENDED_SCENES_FILE, scenes);
  },

  // 设置用户地块场景（扩展）
  async setUserExtendedScene(userId: string, landIndex: number, sceneId: string): Promise<void> {
    const userScenes = await readJSON<UserScene[]>(USER_SCENES_FILE, []);
    const now = new Date().toISOString();

    // 查找或创建用户场景记录
    let userScene = userScenes.find(s => s.userId === userId && s.landIndex === landIndex);

    if (!userScene) {
      userScene = {
        id: `user_scene_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        userId,
        landIndex,
        scenePresetId: sceneId,
        createdAt: now,
        updatedAt: now,
      };
      userScenes.push(userScene);
    } else {
      userScene.scenePresetId = sceneId;
      userScene.updatedAt = now;
    }

    await writeJSON(USER_SCENES_FILE, userScenes);
  },
};

// ==================== 好友系统辅助函数 ====================

// 获取用户的好友列表
async function getFriends(userId: string): Promise<Friend[]> {
  const friends = await readJSON<Friend[]>(FRIENDS_FILE, []);
  return friends.filter(f => f.userId === userId && f.status === 'accepted');
}

// 获取好友申请
async function getFriendRequests(userId: string): Promise<{ sent: FriendRequest[]; received: FriendRequest[] }> {
  const requests = await readJSON<FriendRequest[]>(FRIEND_REQUESTS_FILE, []);
  return {
    sent: requests.filter(r => r.fromUserId === userId && r.status === 'pending'),
    received: requests.filter(r => r.toUserId === userId && r.status === 'pending'),
  };
}

// 发送好友申请
async function sendFriendRequest(
  fromUserId: string,
  fromUserSecondMeId: string,
  fromUserName: string,
  fromBotId: string,
  fromBotName: string,
  toUserId: string,
  toUserSecondMeId: string,
  message?: string
): Promise<FriendRequest> {
  const requests = await readJSON<FriendRequest[]>(FRIEND_REQUESTS_FILE, []);

  // 检查是否已存在待处理申请
  const existing = requests.find(
    r => r.fromUserId === fromUserId && r.toUserId === toUserId && r.status === 'pending'
  );
  if (existing) {
    return existing;
  }

  const newRequest: FriendRequest = {
    id: `friend_req_${Date.now()}_${Math.random().toString(36).substring(7)}`,
    fromUserId,
    fromUserSecondMeId,
    fromUserName,
    fromBotId,
    fromBotName,
    toUserId,
    toUserSecondMeId,
    message,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };
  requests.push(newRequest);
  await writeJSON(FRIEND_REQUESTS_FILE, requests);
  return newRequest;
}

// 接受好友申请
async function acceptFriendRequest(requestId: string): Promise<Friend | null> {
  const requests = await readJSON<FriendRequest[]>(FRIEND_REQUESTS_FILE, []);
  const index = requests.findIndex(r => r.id === requestId);

  if (index === -1) return null;

  const request = requests[index];
  request.status = 'accepted';
  request.respondedAt = new Date().toISOString();
  await writeJSON(FRIEND_REQUESTS_FILE, requests);

  // 创建好友关系（双向）
  const friends = await readJSON<Friend[]>(FRIENDS_FILE, []);

  const now = new Date().toISOString();

  // 检查是否已经是好友
  const alreadyFriends = friends.some(
    f => (f.userId === request.fromUserId && f.friendId === request.toUserId) ||
           (f.userId === request.toUserId && f.friendId === request.fromUserId)
  );

  if (!alreadyFriends) {
    const friend1: Friend = {
      id: `friend_${Date.now()}_${Math.random().toString(36).substring(7)}_1`,
      userId: request.fromUserId,
      friendId: request.toUserId,
      friendSecondMeId: request.toUserSecondMeId,
      friendName: request.toUserId, // 这里应该是被邀请者的名字
      status: 'accepted',
      createdAt: now,
      updatedAt: now,
    };

    const friend2: Friend = {
      id: `friend_${Date.now()}_${Math.random().toString(36).substring(7)}_2`,
      userId: request.toUserId,
      friendId: request.fromUserId,
      friendSecondMeId: request.fromUserSecondMeId,
      friendName: request.fromUserId, // 这里应该是邀请者的名字
      status: 'accepted',
      createdAt: now,
      updatedAt: now,
    };

    friends.push(friend1, friend2);
    await writeJSON(FRIENDS_FILE, friends);
  }

  // 返回好友关系
  return friends.find(f => f.userId === request.fromUserId && f.friendId === request.toUserId) || null;
}

// 拒绝好友申请
async function rejectFriendRequest(requestId: string): Promise<boolean> {
  const requests = await readJSON<FriendRequest[]>(FRIEND_REQUESTS_FILE, []);
  const index = requests.findIndex(r => r.id === requestId);

  if (index === -1) return false;

  requests[index].status = 'rejected';
  requests[index].respondedAt = new Date().toISOString();
  await writeJSON(FRIEND_REQUESTS_FILE, requests);
  return true;
}

// 检查两人是否是好友
async function areFriends(userId1: string, userId2: string): Promise<boolean> {
  const friends = await readJSON<Friend[]>(FRIENDS_FILE, []);
  return friends.some(f =>
    (f.userId === userId1 && f.friendId === userId2) ||
    (f.userId === userId2 && f.friendId === userId1)
  );
}

// 计算思路质量的辅助函数
function calculateIdeaQuality(content: string, category: Idea['category']): number {
  let score = 1;

  // 内容长度加分
  if (content.length > 20) score += 1;
  if (content.length > 50) score += 1;
  if (content.length > 100) score += 1;

  // 包含技术关键词加分
  const techKeywords = ['API', '架构', '优化', '算法', '数据', 'AI', '模型', '系统', '设计', '用户', '性能'];
  const keywordCount = techKeywords.filter(kw => content.includes(kw)).length;
  score += Math.min(keywordCount, 3);

  // 包含具体实现思路加分
  if (content.includes('可以') || content.includes('建议') || content.includes('实现')) score += 1;

  // 分类加分
  if (category === 'architecture' || category === 'ai') score += 1;

  return Math.min(score, 10);
}

// === 60种场景预设 ===
const SCENE_PRESETS: ScenePreset[] = [
  // === 运动场地 ===
  { id: 'basketball', name: '篮球场', emoji: '🏀', category: 'sports', color: '#FF6B35', baseColor: '#ff9800', description: '标准篮球场' },
  { id: 'football', name: '足球场', emoji: '⚽', category: 'sports', color: '#4CAF50', baseColor: '#2e7d32', description: '绿茵足球场' },
  { id: 'tennis', name: '网球场', emoji: '🎾', category: 'sports', color: '#C8F5C', baseColor: '#9dbf4c', description: '红土网球场' },
  { id: 'badminton', name: '羽毛球场', emoji: '🏸', category: 'sports', color: '#81C784', baseColor: '#4cb9b0', description: '绿色羽毛球场' },
  { id: 'volleyball', name: '排球场', emoji: '🏐', category: 'sports', color: '#F59E0B', baseColor: '#f59e0b', description: '沙滩排球场' },
  { id: 'swimming', name: '游泳池', emoji: '🏊', category: 'sports', color: '#06B6D4', baseColor: '#0284c7', description: '蓝色泳池' },
  { id: 'gym', name: '健身房', emoji: '💪', category: 'sports', color: '#EF4444', baseColor: '#b91c1c', description: '健身器材齐全' },
  { id: 'yoga', name: '瑜伽室', emoji: '🧘', category: 'sports', color: '#9333EA', baseColor: '#7c3aed', description: '宁静瑜伽空间' },
  { id: 'track', name: '跑道', emoji: '🏃', category: 'sports', color: '#DC2626', baseColor: '#996515', description: '塑胶红色跑道' },
  { id: 'skating', name: '滑冰场', emoji: '⛸', category: 'sports', color: '#A8E6CF', baseColor: '#93c5fd', description: '冰面滑冰场' },
  { id: 'golf', name: '高尔夫场', emoji: '⛳', category: 'sports', color: '#4ADE80', baseColor: '#3d8b40', description: '草坪高尔夫球场' },

  // === 社交场地 ===
  { id: 'cafe', name: '咖啡厅', emoji: '☕', category: 'social', color: '#8B4513', baseColor: '#6f4e37', description: '温馨咖啡厅' },
  { id: 'cinema', name: '电影院', emoji: '🎬', category: 'social', color: '#7C3AED', baseColor: '#5c2c9c', description: 'IMAX影院' },
  { id: 'karaoke', name: 'KTV', emoji: '🎤', category: 'social', color: '#E11D48', baseColor: '#be185d', description: '嗨唱KTV' },
  { id: 'bar', name: '酒吧', emoji: '🍺', category: 'social', color: '#F59E0B', baseColor: '#f59e0b', description: '特色小酒吧' },
  { id: 'restaurant', name: '餐厅', emoji: '🍽', category: 'social', color: '#FF6B6B', baseColor: '#d97706', description: '美食餐厅' },
  { id: 'hot_spring', name: '温泉', emoji: '♨', category: 'social', color: '#EC4899', baseColor: '#c2185b', description: '日式温泉' },
  { id: 'teahouse', name: '茶室', emoji: '🍵', category: 'social', color: '#88B04B', baseColor: '#5d4037', description: '传统茶室' },
  { id: 'lounge', name: '休息室', emoji: '🛋', category: 'social', color: '#95A5A6', baseColor: '#795548', description: '舒适休息空间' },

  // === 娱乐场地 ===
  { id: 'arcade', name: '游戏厅', emoji: '🕹', category: 'entertainment', color: '#A855F7', baseColor: '#6d28d9', description: '电玩城' },
  { id: 'bowling', name: '保龄球馆', emoji: '🎳', category: 'entertainment', color: '#EC4899', baseColor: '#c2185b', description: '保龄球道' },
  { id: 'billiards', name: '台球馆', emoji: '🎱', category: 'entertainment', color: '#6366F1', baseColor: '#4a5568', description: '台球俱乐部' },
  { id: 'escape_room', name: '密室逃脱', emoji: '🔒', category: 'entertainment', color: '#6B7280', baseColor: '#4a3f35', description: '恐怖密室' },
  { id: 'concert', name: '音乐厅', emoji: '🎵', category: 'entertainment', color: '#F59E0B', baseColor: '#f59e0b', description: '音乐演出场地' },
  { id: 'theater', name: '剧院', emoji: '🎭', category: 'entertainment', color: '#7C3AED', baseColor: '#5c2c9c', description: '大剧院舞台' },

  // === 办公场景 ===
  { id: 'office', name: '办公室', emoji: '🏢', category: 'work', color: '#64748B', baseColor: '#4b5563', description: '现代办公楼' },
  { id: 'coworking', name: '共享办公', emoji: '👥', category: 'work', color: '#14B8A6', baseColor: '#0d9488', description: '开放办公位' },
  { id: 'meeting_room', name: '会议室', emoji: '📋', category: 'work', color: '#059669', baseColor: '#8b5cf6', description: '投影会议室' },
  { id: 'studio', name: '工作室', emoji: '🎨', category: 'work', color: '#8B5CF6', baseColor: '#7c3aed', description: '创意工作室' },
  { id: 'library', name: '图书馆', emoji: '📚', category: 'work', color: '#9333EA', baseColor: '#7c4ae8', description: '安静图书馆' },
  { id: 'server_room', name: '服务器房', emoji: '🖥', category: 'work', color: '#374151', baseColor: '#6d28d9', description: '数据中心机房' },

  // === 自然景观 ===
  { id: 'park', name: '公园', emoji: '🌳', category: 'nature', color: '#4CAF50', baseColor: '#2e7d32', description: '城市公园' },
  { id: 'forest', name: '森林', emoji: '🌲', category: 'nature', color: '#228B22', baseColor: '#145a32', description: '松树林' },
  { id: 'lake', name: '湖泊', emoji: '💧', category: 'nature', color: '#0EA5E9', baseColor: '#0ea5e9', description: '清澈湖水' },
  { id: 'mountain', name: '雪山', emoji: '🏔', category: 'nature', color: '#78909C', baseColor: '#e5e7e6', description: '雪山峰顶' },
  { id: 'beach', name: '沙滩', emoji: '🏖', category: 'nature', color: '#FCD34D', baseColor: '#fbbf24', description: '金色沙滩' },
  { id: 'garden', name: '花园', emoji: '🌸', category: 'nature', color: '#EC4899', baseColor: '#c2185b', description: '美丽花园' },

  // === 爱好/兴趣 ===
  { id: 'book', name: '书房', emoji: '📖', category: 'hobby', color: '#8D6E63', baseColor: '#6b7280', description: '读书空间' },
  { id: 'music', name: '音乐室', emoji: '🎼', category: 'hobby', color: '#FA518C', baseColor: '#be185d', description: '音乐工作室' },
  { id: 'game', name: '游戏室', emoji: '🎮', category: 'hobby', color: '#A855F7', baseColor: '#6d28d9', description: '游戏娱乐室' },
  { id: 'cooking', name: '厨房', emoji: '🍳', category: 'hobby', color: '#FB923C', baseColor: '#c2410c', description: '开放式厨房' },
  { id: 'workshop', name: '工坊', emoji: '🛠', category: 'hobby', color: '#78716C', baseColor: '#525252', description: 'DIY工坊' },
];

// 获取场景预设列表
export function getScenePresets(): ScenePreset[] {
  return SCENE_PRESETS;
}

// 导出类型别名（避免命名冲突）
export type { Idea as IdeaType, Land as LandType, Building as BuildingType, DailyReward as DailyRewardType };
