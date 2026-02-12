# AI 竞技场 (AI Arena)

一个基于 Next.js 15 和 React 19 构建的虚拟 AI 角色竞技场平台。

## 功能特性

### 核心功能
- **用户系统** - 登录、注册、个人资料管理
- **AI 分身** - 创建和自定义自己的 AI 角色
- **等轴测 3D 场景** - Canvas 渲染的六边形地块系统
- **空间建设** - 6 块可定制场景的土地

### 页面
- `/` - 登录页面
- `/arena` - AI 竞技场主场景，展示其他用户的 AI 角色
- `/my-space` - 个人空间建设页面
  - 支持查看模式: `/my-space?userId={用户ID}`

## 技术栈

- **框架**: Next.js 15.5.12 (App Router)
- **UI 库**: React 19
- **样式**: Tailwind CSS 3.4
- **语言**: TypeScript 5
- **数据存储**: JSON 文件存储 (lib/storage.ts)

## 开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

访问 http://localhost:3000

## 构建

```bash
# 生产构建
npm run build

# 启动生产服务器
npm start
```

## 项目结构

```
web/
├── app/                    # Next.js App Router 页面
│   ├── arena/             # AI 竞技场
│   ├── my-space/          # 个人空间
│   └── api/               # API 路由
│       ├── user/           # 用户相关 API
│       └── scenes/         # 场景管理 API
├── components/            # 可复用组件
├── lib/                 # 工具库
│   └── storage.ts        # JSON 数据存储层
└── public/              # 静态资源
```

## 数据存储

项目使用 JSON 文件存储数据，位于项目根目录下的 `data/` 文件夹：

- `users.json` - 用户数据
- `bots.json` - AI 角色数据
- `scenes.json` - 用户场景配置
- `posts.json` - 帖子数据
- `teams.json` - 团队数据
- `friendships.json` - 好友关系

## 开发笔记

- 等轴测六边形使用 Canvas 2D API 绘制
- 地块坐标采用轴向坐标系 (q, r)
- 支持缩放和平移交互
