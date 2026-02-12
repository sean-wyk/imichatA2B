## 实时聊天室（Next.js + Pusher）

一个基于 **Next.js 16 + TypeScript + Tailwind CSS 4 + Pusher** 的简洁实时聊天室示例，支持匿名昵称、公共房间实时聊天，适合学习和直接部署到 Vercel 演示。

---

### 功能特性

- **公共聊天室**：所有在线用户共享一个房间。
- **实时消息**：使用 Pusher Channels 推送新消息，页面自动更新，无需刷新。
- **匿名昵称**：
  - 首次进入自动生成形如 `用户1234` 的随机昵称。
  - 顶部可以修改昵称，后续发送消息会使用新昵称。
- **输入体验**：
  - `Enter` 发送消息。
  - `Shift + Enter` 换行。
- **现代深色 UI**：使用 Tailwind CSS 4，玻璃拟态风格。
- **可扩展性强**：当前不做消息持久化，后续容易接入数据库（Supabase / PlanetScale / Neon 等）。

---

### 技术栈

- **框架**：Next.js 16（App Router）
- **语言**：TypeScript
- **样式**：Tailwind CSS 4
- **实时通讯**：Pusher Channels（`pusher` + `pusher-js`）

---

### 目录结构（关键部分）

```text
chat-app
├─ src
│  ├─ app
│  │  ├─ page.tsx              // 聊天室页面（前端 UI + Pusher 客户端订阅）
│  │  └─ api
│  │     └─ messages
│  │        └─ route.ts        // 发送消息的 API（服务端触发 Pusher 事件）
│  └─ lib
│     └─ pusher.ts             // Pusher 服务端 & 客户端封装
├─ public
├─ package.json
├─ README.md
└─ ...
```

---

### 环境变量配置

本项目依赖 Pusher Channels 实现实时通讯，需要配置以下环境变量：

```bash
PUSHER_APP_ID=你的_app_id
PUSHER_KEY=你的_key
PUSHER_SECRET=你的_secret
PUSHER_CLUSTER=你的_cluster

NEXT_PUBLIC_PUSHER_KEY=你的_key
NEXT_PUBLIC_PUSHER_CLUSTER=你的_cluster



#PUSHER
app_id = "2114612"
key = "440fbc395099050a9bd7"
secret = "3e3884d37c5dbc43b4ba"
cluster = "ap3"
```

#### 本地开发环境

在项目根目录 `chat-app` 下创建 `.env.local` 文件：

```bash
PUSHER_APP_ID=xxx
PUSHER_KEY=xxx
PUSHER_SECRET=xxx
PUSHER_CLUSTER=xxx

NEXT_PUBLIC_PUSHER_KEY=xxx
NEXT_PUBLIC_PUSHER_CLUSTER=xxx
```

> `.env.local` 不会被提交到 Git，用于本地开发调试。

---

### 本地启动

1. 安装依赖（如果已经装过可跳过）：

   ```bash
   npm install
   ```

2. 确认 `.env.local` 中已正确配置 Pusher 的环境变量。

3. 启动开发服务器：

   ```bash
   npm run dev
   ```

4. 浏览器访问 `http://localhost:3000` 即可看到聊天室页面。

5. 可打开多个浏览器窗口 / 不同设备，输入消息验证实时聊天效果。

---

### 关键实现说明

- `src/lib/pusher.ts`
  - 封装了服务端 `pusherServer` 与客户端 `getPusherClient()`。
  - 服务端使用 `PUSHER_APP_ID / PUSHER_KEY / PUSHER_SECRET / PUSHER_CLUSTER` 初始化。
  - 客户端在浏览器环境下使用 `NEXT_PUBLIC_PUSHER_KEY / NEXT_PUBLIC_PUSHER_CLUSTER` 创建 `PusherClient`。

- `src/app/api/messages/route.ts`
  - 接收来自前端的 `POST` 请求，body 形如 `{ user, text }`。
  - 做基础参数校验与长度限制。
  - 构造消息对象并通过 `pusherServer.trigger("public-chat", "new-message", message)` 广播。

- `src/app/page.tsx`
  - 客户端组件（`"use client";`）。
  - 使用 `useEffect` 连接 Pusher，订阅 `public-chat` 频道的 `new-message` 事件。
  - 接收到新消息后更新本地 `messages` 状态，实现 UI 实时刷新。
  - 支持修改昵称、回车发送、多行输入提示等。

---

### 部署到 Vercel

1. **Git 仓库准备**

   ```bash
   git init
   git add .
   git commit -m "feat: init realtime chat app"
   ```

   然后推送到 GitHub / GitLab / Bitbucket：

   ```bash
   git remote add origin https://github.com/你的用户名/你的仓库名.git
   git push -u origin main
   ```

2. **在 Vercel 导入项目**

   - 登录 `https://vercel.com`。
   - 点击 “Add New Project” -> 选择刚才的 Git 仓库。
   - Vercel 会自动识别为 Next.js 项目，默认配置保持不变：
     - Build Command: `next build`
     - Output Directory: `.next`

3. **配置环境变量**

   在 Vercel 项目页 -> **Settings -> Environment Variables** 中添加：

   - `PUSHER_APP_ID`
   - `PUSHER_KEY`
   - `PUSHER_SECRET`
   - `PUSHER_CLUSTER`
   - `NEXT_PUBLIC_PUSHER_KEY`
   - `NEXT_PUBLIC_PUSHER_CLUSTER`

   建议在 `Production / Preview / Development` 环境中都配置同样的值，保存后重新部署。

4. **访问线上地址**

   部署完成后，Vercel 会分配一个生产 URL，比如：

   ```text
   https://your-chat-app.vercel.app
   ```

   打开多个浏览器窗口访问该地址，即可进行实时聊天。

---

### 后续扩展建议

- **消息持久化**：接入数据库（Supabase / PlanetScale / Neon / Postgres 等），在 API 中保存与读取历史消息。
- **用户系统**：通过 NextAuth.js / Clerk / Auth0 等接入登录系统，为用户添加头像、唯一 ID。
- **多房间 / 群组**：基于 URL 或动态路由创建不同房间，对应不同 Pusher 频道。
- **管理能力**：增加敏感词过滤、踢人、禁言等后台管理功能。

如果你基于本项目继续扩展，建议在此 README 中补充你自己的业务说明与接口文档。 

