# 部署说明

## Vercel 部署限制

由于 Vercel 的 Serverless 环境限制，Telegram 文件上传功能在 Vercel 上**无法直接使用**。

### 原因

1. Vercel 不支持 HTTP/HTTPS 代理
2. 中国大陆无法直接访问 Telegram API
3. `undici` 的 `ProxyAgent` 在 Vercel Edge Runtime 中不可用

### 解决方案

#### 方案 1：本地运行（推荐用于开发）

```bash
npm run dev
```

确保 `.env` 文件中配置了代理：

```env
HTTPS_PROXY=http://127.0.0.1:7890
```

#### 方案 2：使用 Cloudflare Workers 代理

创建一个 Cloudflare Worker 来转发 Telegram API 请求：

```javascript
export default {
  async fetch(request) {
    const url = new URL(request.url);
    const telegramUrl = `https://api.telegram.org${url.pathname}${url.search}`;
    
    return fetch(telegramUrl, {
      method: request.method,
      headers: request.headers,
      body: request.body,
    });
  }
}
```

然后修改 `src/app/api/telegram/upload/route.ts`，将 `https://api.telegram.org` 替换为你的 Worker URL。

#### 方案 3：切换到其他存储服务

推荐使用以下服务替代 Telegram：

- **阿里云 OSS**：40 GB 免费存储
- **七牛云**：10 GB 免费存储
- **Cloudflare R2**：10 GB 免费存储

#### 方案 4：部署到支持代理的平台

- Railway
- Render
- Fly.io
- 自建 VPS

## 环境变量配置

在 Vercel 项目设置中添加以下环境变量：

```
PUSHER_APP_ID=your_app_id
PUSHER_KEY=your_key
PUSHER_SECRET=your_secret
PUSHER_CLUSTER=your_cluster

NEXT_PUBLIC_PUSHER_KEY=your_key
NEXT_PUBLIC_PUSHER_CLUSTER=your_cluster

UPSTASH_REDIS_REST_URL=your_redis_url
UPSTASH_REDIS_REST_TOKEN=your_redis_token

TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_CHAT_ID=your_chat_id
```

注意：即使配置了 `TELEGRAM_BOT_TOKEN`，文件上传功能在 Vercel 上仍然无法使用。

## 功能可用性

| 功能 | 本地开发 | Vercel 部署 |
|------|---------|------------|
| 实时聊天 | ✅ | ✅ |
| 消息存储 | ✅ | ✅ |
| 多会话管理 | ✅ | ✅ |
| Telegram 文件上传 | ✅ | ❌ |
| Telegram 文件下载 | ✅ | ❌ |

## 推荐部署方式

如果需要完整功能（包括 Telegram 文件存储），建议：

1. 使用 Railway 或 Render 部署（支持 Docker）
2. 或者使用 Cloudflare Workers 作为 Telegram API 代理
3. 或者切换到阿里云 OSS 等对象存储服务
