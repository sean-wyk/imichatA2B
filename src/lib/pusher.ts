import PusherServer from "pusher";
import PusherClient from "pusher-js";

// 服务端 Pusher 实例（用于触发事件）
export const pusherServer = new PusherServer({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.PUSHER_CLUSTER!,
  useTLS: true,
});

// 客户端 Pusher 工厂函数（在浏览器中使用）
export function getPusherClient() {
  if (typeof window === "undefined") return null;

  const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
  const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;

  if (!key || !cluster) return null;

  return new PusherClient(key, {
    cluster,
  });
}

