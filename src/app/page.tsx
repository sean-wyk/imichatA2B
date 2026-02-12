"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { getPusherClient } from "@/lib/pusher";
import type { ChatAttachment, ChatMessage } from "@/types/chat";
import { ChatHeader } from "@/components/chat/ChatHeader";
import { MessageList } from "@/components/chat/MessageList";
import { MessageInput } from "@/components/chat/MessageInput";
import { ImagePreview } from "@/components/chat/ImagePreview";
import { uploadToImageHost } from "./page-upload-helper";

export default function Home() {
  const [user, setUser] = useState("");
  const [tempUser, setTempUser] = useState("");
  const [text, setText] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sending, setSending] = useState(false);
  const [connecting, setConnecting] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attachments, setAttachments] = useState<ChatAttachment[]>([]);
  const [uploading, setUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState<ChatAttachment | null>(null);
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

  // 初始化加载当天历史消息 + 连接 Pusher，订阅新消息
  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        // 先拉取当天历史消息
        const res = await fetch("/api/messages");
        if (res.ok) {
          const data = (await res.json()) as { messages?: ChatMessage[] };
          if (!cancelled && Array.isArray(data.messages)) {
            setMessages(data.messages);
          }
        }
      } catch (e) {
        console.error(e);
        if (!cancelled) {
          setError("加载历史消息失败");
        }
      }

      const pusher = getPusherClient();
      if (!pusher) {
        if (!cancelled) {
          setError("实时服务未配置，请先在 Vercel 中配置 Pusher 环境变量。");
          setConnecting(false);
        }
        return;
      }

      const channel = pusher.subscribe("public-chat");
      channel.bind("new-message", (data: ChatMessage) => {
        setMessages((prev) => [...prev, data]);
      });

      if (!cancelled) {
        setConnecting(false);
      }

      return () => {
        channel.unbind_all();
        pusher.unsubscribe("public-chat");
        pusher.disconnect();
      };
    }

    const cleanupPromise = init();

    return () => {
      cancelled = true;
      void cleanupPromise;
    };
  }, []);

  const handleSend = async () => {
    if (!text.trim() && attachments.length === 0) return;
    setSending(true);
    setError(null);

    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ user, text, attachments }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "发送失败");
      }

      setText("");
      setAttachments([]);
    } catch (e) {
      console.error(e);
      setError((e as Error).message || "发送消息失败");
    } finally {
      setSending(false);
    }
  };

  const title = useMemo(() => "实时聊天室", []);

  const handleFilesSelected = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    setError(null);

    try {
      const uploaded: ChatAttachment[] = [];
      for (const file of Array.from(files)) {
        const isImage = file.type.startsWith("image/");

        if (isImage) {
          // 仅图片调用后端代理图床接口
          const url = await uploadToImageHost(file);
          uploaded.push({
            url,
            name: file.name,
            type: "image",
          });
        } else {
          // 文件先只透传名称，url 留空，后续可接入文件存储
          uploaded.push({
            url: "",
            name: file.name,
            type: "file",
          });
        }
      }
      setAttachments((prev) => [...prev, ...uploaded]);
    } catch (e) {
      console.error(e);
      setError("上传失败，请稍后重试");
    } finally {
      setUploading(false);
    }
  };

  return (
    <main className="flex min-h-screen w-full flex-col bg-white text-slate-900">
      <div className="flex h-full w-full flex-1 flex-col px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
        <ChatHeader
          title={title}
          user={user}
          tempUser={tempUser}
          onTempUserChange={setTempUser}
          onConfirmUser={() => setUser(tempUser.trim() || user)}
        />

        <MessageList
          messages={messages}
          currentUser={user}
          connecting={connecting}
          error={error}
          messagesEndRef={messagesEndRef}
          onImageClick={(image) => setPreviewImage(image)}
        />

        <MessageInput
          value={text}
          sending={sending}
          canSend={!!text.trim() || attachments.length > 0}
          uploading={uploading}
          attachments={attachments}
          onChange={setText}
          onSend={handleSend}
          onFilesSelected={handleFilesSelected}
        />

        <p className="mt-2 text-[10px] text-slate-400">
          本示例仅做演示，不做消息持久化。如果你需要保存聊天记录，可以后续接入数据库（例如
          PlanetScale / Neon / Supabase 等）。
        </p>
      </div>
      <ImagePreview image={previewImage} onClose={() => setPreviewImage(null)} />
    </main>
  );
}

