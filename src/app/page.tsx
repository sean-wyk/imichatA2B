 "use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { getPusherClient } from "@/src/lib/pusher";

type ChatMessage = {
  id: string;
  user: string;
  text: string;
  createdAt: string;
};

export default function Home() {
  const [user, setUser] = useState("");
  const [tempUser, setTempUser] = useState("");
  const [text, setText] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sending, setSending] = useState(false);
  const [connecting, setConnecting] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // 初始化一个默认昵称
  useEffect(() => {
    const defaultName = `用户${Math.floor(Math.random() * 9000) + 1000}`;
    setUser(defaultName);
    setTempUser(defaultName);
  }, []);

  // 滚动到最新消息
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // 连接 Pusher，订阅消息
  useEffect(() => {
    const pusher = getPusherClient();
    if (!pusher) {
      setError("实时服务未配置，请先在 Vercel 中配置 Pusher 环境变量。");
      setConnecting(false);
      return;
    }

    const channel = pusher.subscribe("public-chat");
    channel.bind("new-message", (data: ChatMessage) => {
      setMessages((prev) => [...prev, data]);
    });

    setConnecting(false);

    return () => {
      channel.unbind_all();
      pusher.unsubscribe("public-chat");
      pusher.disconnect();
    };
  }, []);

  const handleSend = async () => {
    if (!text.trim()) return;
    setSending(true);
    setError(null);

    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ user, text }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "发送失败");
      }

      setText("");
    } catch (e) {
      console.error(e);
      setError((e as Error).message || "发送消息失败");
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!sending) {
        handleSend();
      }
    }
  };

  const title = useMemo(() => "实时聊天室", []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-4 py-6 text-zinc-50">
      <main className="flex h-[90vh] w-full max-w-3xl flex-col rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 shadow-2xl backdrop-blur">
        <header className="mb-3 flex items-center justify-between border-b border-zinc-800 pb-2">
          <div>
            <h1 className="text-lg font-semibold tracking-tight">{title}</h1>
            <p className="mt-1 text-xs text-zinc-400">
              所有在线用户共享一个房间，输入消息后会实时广播给所有人。
            </p>
          </div>
          <div className="flex items-center gap-2">
            <input
              className="h-8 rounded-full border border-zinc-700 bg-zinc-900 px-3 text-xs outline-none ring-0 focus:border-zinc-400"
              value={tempUser}
              maxLength={20}
              onChange={(e) => setTempUser(e.target.value)}
            />
            <button
              className="h-8 rounded-full bg-zinc-100 px-3 text-xs font-medium text-zinc-900 hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
              onClick={() => setUser(tempUser.trim() || user)}
            >
              修改昵称
            </button>
          </div>
        </header>

        <section className="flex-1 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950/40">
          <div className="flex h-full flex-col">
            <div className="flex-1 space-y-2 overflow-y-auto p-4 text-sm">
              {connecting && (
                <p className="text-xs text-zinc-500">正在连接实时服务...</p>
              )}
              {error && (
                <p className="text-xs text-red-400">
                  {error}（本地开发时请确保已配置 .env.local）
                </p>
              )}
              {messages.length === 0 && !connecting && !error && (
                <p className="text-xs text-zinc-500">
                  暂无消息，发送一条消息开始聊天吧～
                </p>
              )}

              {messages.map((msg) => (
                <div key={msg.id} className="flex flex-col gap-1">
                  <div className="flex items-baseline gap-2">
                    <span className="text-xs font-medium text-emerald-300">
                      {msg.user}
                    </span>
                    <span className="text-[10px] text-zinc-500">
                      {new Date(msg.createdAt).toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="max-w-[80%] rounded-2xl bg-zinc-800 px-3 py-2 text-xs text-zinc-100">
                    {msg.text}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </div>
        </section>

        <footer className="mt-3 flex flex-col gap-2">
          <div className="flex items-end gap-2">
            <textarea
              className="min-h-[60px] flex-1 resize-none rounded-xl border border-zinc-800 bg-zinc-950/60 px-3 py-2 text-sm outline-none ring-0 placeholder:text-zinc-500 focus:border-zinc-500"
              placeholder="按 Enter 发送，Shift + Enter 换行"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <button
              className="h-[60px] w-24 shrink-0 rounded-xl bg-emerald-500 text-sm font-medium text-emerald-950 shadow hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={sending || !text.trim()}
              onClick={handleSend}
            >
              {sending ? "发送中..." : "发送"}
            </button>
          </div>
          <p className="text-[10px] text-zinc-500">
            本示例仅做演示，不做消息持久化。如果你需要保存聊天记录，可以后续接入数据库（例如
            PlanetScale / Neon / Supabase 等）。
          </p>
        </footer>
      </main>
    </div>
  );
}

