import { NextRequest, NextResponse } from "next/server";
import { pusherServer } from "@/src/lib/pusher";

type ChatMessage = {
  id: string;
  user: string;
  text: string;
  createdAt: string;
};

export async function POST(req: NextRequest) {
  try {
    const { user, text } = (await req.json()) as {
      user?: string;
      text?: string;
    };

    if (!text || !text.trim()) {
      return NextResponse.json(
        { error: "消息内容不能为空" },
        { status: 400 },
      );
    }

    const safeUser = (user || "匿名用户").slice(0, 20);
    const safeText = text.slice(0, 500);

    const message: ChatMessage = {
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      user: safeUser,
      text: safeText,
      createdAt: new Date().toISOString(),
    };

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

