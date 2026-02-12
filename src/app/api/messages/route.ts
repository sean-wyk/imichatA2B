import { NextRequest, NextResponse } from "next/server";
import { pusherServer } from "@/lib/pusher";
import type { ChatAttachment, ChatMessage } from "@/types/chat";
import { redis } from "@/lib/redis";

function getTodayKey() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `chat:public:${y}-${m}-${d}`;
}

export async function GET() {
  try {
    const key = getTodayKey();
    const raw = await redis.lrange<string>(key, 0, -1);
    const messages: ChatMessage[] = [];

    for (const item of raw) {
      try {
        const parsed = JSON.parse(item) as ChatMessage;
        messages.push(parsed);
      } catch {
        // ignore bad entries
      }
    }

    return NextResponse.json({ messages });
  } catch (error) {
    console.error("读取 Redis 消息失败", error);
    return NextResponse.json({ messages: [] });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { user, text, attachments } = (await req.json()) as {
      user?: string;
      text?: string;
      attachments?: ChatAttachment[];
    };

    const hasText = !!text && !!text.trim();
    const hasAttachments = Array.isArray(attachments) && attachments.length > 0;

    if (!hasText && !hasAttachments) {
      return NextResponse.json(
        { error: "消息内容或附件不能为空" },
        { status: 400 },
      );
    }

    const safeUser = (user || "匿名用户").slice(0, 20);
    const safeText = (text || "").slice(0, 500);
    const safeAttachments: ChatAttachment[] | undefined = hasAttachments
      ? attachments!.slice(0, 10).map((att) => ({
          url: String(att.url).slice(0, 500),
          name: String(att.name || "附件").slice(0, 100),
          type: att.type === "image" ? "image" : ("file" as const),
        }))
      : undefined;

    const message: ChatMessage = {
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      user: safeUser,
      text: safeText,
      createdAt: new Date().toISOString(),
      attachments: safeAttachments,
    };
    const key = getTodayKey();

    try {
      // 存入 Redis 列表，并设置 2 天过期时间（秒）
      await redis.rpush(key, JSON.stringify(message));
      await redis.expire(key, 60 * 60 * 24 * 2);
    } catch (err) {
      console.error("写入 Redis 失败", err);
      // 即使写 Redis 失败，也尽量继续广播消息
    }

    await pusherServer.trigger("public-chat", "new-message", message);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("发送消息失败", error);
    return NextResponse.json(
      { error: "发送消息失败" },
      { status: 500 },
    );
  }
}

