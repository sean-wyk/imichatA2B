import { NextRequest, NextResponse } from "next/server";
import { pusherServer } from "@/lib/pusher";
import type { ChatAttachment, ChatMessage } from "@/types/chat";
import { redis } from "@/lib/redis";

// 确保每次请求都会实时从 Redis 读取，而不是被 Next.js 缓存
export const dynamic = "force-dynamic";

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
    const raw = await redis.lrange<ChatMessage | string>(key, 0, -1);
    const messages: ChatMessage[] = [];

    for (const item of raw) {
      if (!item) continue;
      if (typeof item === "string") {
        try {
          const parsed = JSON.parse(item) as ChatMessage;
          messages.push(parsed);
        } catch {
          // ignore bad string
        }
      } else {
        messages.push(item as ChatMessage);
      }
    }

    return NextResponse.json({ messages });
  } catch (error) {
    console.error("Failed to read Redis messages", error);
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
        { error: "Message content or attachments cannot be empty" },
        { status: 400 },
      );
    }

    const safeUser = (user || "Anonymous").slice(0, 50);
    const safeText = text || "";
    const safeAttachments: ChatAttachment[] | undefined = hasAttachments
      ? attachments!.slice(0, 10).map((att) => ({
          url: String(att.url).slice(0, 1000),
          name: String(att.name || "File").slice(0, 200),
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
      await redis.rpush(key, message);
      await redis.expire(key, 60 * 60 * 24 * 2);
    } catch (err) {
      console.error("Failed to write to Redis", err);
    }

    await pusherServer.trigger("public-chat", "new-message", message);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to send message", error);
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 },
    );
  }
}

