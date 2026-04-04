# Deployment Notes

## Vercel and Telegram Uploads

This project can be deployed to Vercel.

The important detail is that your local proxy only exists on your own machine. A Vercel Function cannot use `http://127.0.0.1:10808` from your laptop, so you should not copy local proxy variables into Vercel production settings.

Current behavior:

- Local development:
  - If `HTTP_PROXY` or `HTTPS_PROXY` is set, server-side Telegram requests will use it.
- Vercel:
  - If the proxy points to `127.0.0.1`, `localhost`, or `::1`, the app will ignore it automatically and connect to Telegram directly.

In most Vercel regions, outbound access to the Telegram Bot API works without an extra proxy.

## Vercel Limits

Vercel Functions still have request and response body size limits. That means Telegram upload or download through your Next.js API routes is suitable for small files, but large files can fail because of platform limits.

If you need larger uploads, consider:

- Cloudflare R2
- Aliyun OSS
- Qiniu
- Railway / Render / VPS for the upload proxy

## Required Environment Variables

Set these in Vercel Project Settings -> Environment Variables:

```env
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

Do not set these in Vercel unless your deployed environment really has such a proxy:

```env
HTTPS_PROXY=http://127.0.0.1:10808
HTTP_PROXY=http://127.0.0.1:10808
```

## Recommended Local Setup

Use `.env.local` for local secrets and local proxy settings. Do not commit real secrets.

You can start from `.env.example` and fill in your own values.
