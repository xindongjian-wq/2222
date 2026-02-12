const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, 'data');

// 创建 data 目录
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
  console.log('Created data directory');
}

// 创建所有需要的数据文件
const files = [
  { name: 'users.json', content: [] },
  { name: 'bots.json', content: [] },
  { name: 'scenes.json', content: { data: [] } },
  { name: 'extended_scenes.json', content: { data: [] } },
  { name: 'posts.json', content: {} },
  { name: 'teams.json', content: {} },
  { name: 'discussions.json', content: {} },
  { name: 'messages.json', content: {} },
  { name: 'scores.json', content: { data: [] } },
  { name: 'daily_rewards.json', content: { lastUpdate: '' } },
  { name: 'lands.json', content: { data: [] } },
  { name: 'ideas.json', content: { data: [] } },
  { name: 'friends.json', content: { data: [] } },
  { name: 'friend_requests.json', content: { data: [] } },
  { name: 'npc_ideas.json', content: { data: [] } },
  { name: 'npc_knowledge.json', content: {} },
  { name: 'npc_messages.json', content: { data: [] } },
  { name: 'npc_work_state.json', content: {} },
  { name: 'user_scenes.json', content: {} },
];

files.forEach(file => {
  const filePath = path.join(dataDir, file.name);
  const fileContent = JSON.stringify(file.content, null, 2);
  fs.writeFileSync(filePath, fileContent, 'utf8');
  console.log('Created:', file.name);
});

console.log('All data files initialized!');
