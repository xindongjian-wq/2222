# SecondMe 集成项目

## 项目概述

本项目集成 SecondMe OAuth2 登录和 API 功能。

## 已选模块

- **auth** - OAuth2 登录认证
- **profile** - 用户信息（基础信息、兴趣标签、软记忆）
- **chat** - 聊天对话功能
- **note** - 笔记添加功能

## API 配置

| 配置项 | 值 |
|--------|-----|
| Base URL | `https://app.mindos.com/gate/lab` |
| OAuth URL | `https://go.second.me/oauth/` |
| Client ID | `5a897b48-94ec-404c-8410-ab271c381967` |
| Redirect URI | `http://localhost:3000/api/auth/callback` |

## 权限 Scopes

- `user.info` - 用户基础信息
- `user.info.shades` - 用户兴趣标签
- `user.info.softmemory` - 用户软记忆
- `chat` - 聊天功能
- `note.add` - 添加笔记

## 数据库

- **类型**: PostgreSQL
- **默认连接串**: `postgresql://postgres:password@localhost:5432/secondme_app?schema=public`

> 请在项目创建后修改 `.env.local` 中的 `DATABASE_URL` 为实际值

## 开发指南

### 启动项目

```bash
# 1. 安装依赖
npm install

# 2. 初始化数据库
npx prisma db push

# 3. 启动开发服务器
npm run dev
```

### API 调用示例

所有 SecondMe API 响应都遵循统一格式：

```json
{
  "code": 0,
  "data": { ... }
}
```

前端必须正确提取 `data` 字段：

```typescript
const response = await fetch('/api/secondme/user/info');
const result = await response.json();
if (result.code === 0) {
  const userInfo = result.data;  // 正确！
}
```

### 可用 API 端点

| 端点 | 数据路径 | 说明 |
|------|---------|------|
| `/api/secondme/user/info` | `result.data` | 用户基础信息 |
| `/api/secondme/user/shades` | `result.data.shades` | 兴趣标签 |
| `/api/secondme/user/softmemory` | `result.data.list` | 软记忆 |
| `/api/secondme/chat/session/list` | `result.data.sessions` | 会话列表 |
| `/api/secondme/note/add` | `result.data.noteId` | 添加笔记 |

## 配置文件

- `.secondme/state.json` - 项目配置（敏感信息，勿提交到 Git）
- `.env.local` - 环境变量（敏感信息，勿提交到 Git）

## 下一步

运行 `/secondme-prd` 定义产品需求，然后运行 `/secondme-nextjs` 生成项目代码。
