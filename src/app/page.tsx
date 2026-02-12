"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { getPusherClient } from "@/lib/pusher";
import type { ChatAttachment, ChatMessage } from "@/types/chat";
import { ChatHeader } from "@/components/chat/ChatHeader";
import { MessageList } from "@/components/chat/MessageList";
import { MessageInput } from "@/components/chat/MessageInput";
import { ImagePreview } from "@/components/chat/ImagePreview";
import { Sidebar } from "@/components/chat/Sidebar";

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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentSession, setCurrentSession] = useState("default");
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const defaultName = `User${Math.floor(Math.random() * 9000) + 1000}`;
    setUser(defaultName);
    setTempUser(defaultName);
  }, []);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        const res = await fetch(`/api/messages?session=${currentSession}`);
        if (res.ok) {
          const data = (await res.json()) as { messages?: ChatMessage[] };
          if (!cancelled && Array.isArray(data.messages)) {
            setMessages(data.messages);
          }
        }
      } catch (e) {
        console.error(e);
        if (!cancelled) {
          setError("Failed to load messages");
        }
      }

      const pusher = getPusherClient();
      if (!pusher) {
        if (!cancelled) {
          setError("Pusher not configured. Please set environment variables.");
          setConnecting(false);
        }
        return;
      }

      const channel = pusher.subscribe(`chat-${currentSession}`);
      channel.bind("new-message", (data: ChatMessage) => {
        setMessages((prev) => [...prev, data]);
      });

      if (!cancelled) {
        setConnecting(false);
      }

      return () => {
        channel.unbind_all();
        pusher.unsubscribe(`chat-${currentSession}`);
        pusher.disconnect();
      };
    }

    const cleanupPromise = init();

    return () => {
      cancelled = true;
      void cleanupPromise;
    };
  }, [currentSession]);

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
        body: JSON.stringify({ user, text, attachments, session: currentSession }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to send");
      }

      setText("");
      setAttachments([]);
    } catch (e) {
      console.error(e);
      setError((e as Error).message || "Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const handleDeleteMessage = (messageId: string) => {
    setMessages((prev) => prev.filter((msg) => msg.id !== messageId));
  };

  const handleClearCache = async () => {
    try {
      await fetch(`/api/messages?session=${currentSession}`, {
        method: "DELETE",
      });
      setMessages([]);
    } catch (error) {
      console.error("Failed to clear cache:", error);
      alert("清空消息失败");
    }
  };

  const handleSessionChange = (sessionId: string) => {
    setCurrentSession(sessionId);
    setMessages([]);
    setSidebarOpen(false);
  };

  const title = useMemo(() => "聊天室", []);

  const handleFilesSelected = async (files: File[] | FileList | null) => {
    if (!files) return;
    const fileArray = Array.isArray(files) ? files : Array.from(files);
    if (fileArray.length === 0) return;
    setUploading(true);
    setError(null);

    try {
      const uploaded: ChatAttachment[] = [];
      for (const file of fileArray) {
        const isImage = file.type.startsWith("image/");

        const formData = new FormData();
        formData.append("file", file);

        const uploadRes = await fetch("/api/telegram/upload", {
          method: "POST",
          body: formData,
        });

        const uploadData = await uploadRes.json();

        if (!uploadData.success) {
          throw new Error("Upload failed");
        }

        await fetch("/api/telegram/files", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            fileId: uploadData.fileId,
            fileName: uploadData.fileName,
            fileSize: uploadData.fileSize,
            uploadedBy: user,
          }),
        });

        const downloadUrl = `/api/telegram/file/${uploadData.fileId}`;

        uploaded.push({
          url: downloadUrl,
          name: file.name,
          type: isImage ? "image" : "file",
        });
      }
      setAttachments((prev) => [...prev, ...uploaded]);
    } catch (e) {
      console.error(e);
      setError("Upload failed, please try again");
    } finally {
      setUploading(false);
    }
  };

  return (
    <main className="flex min-h-screen w-full flex-col bg-white text-slate-900">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        currentSession={currentSession}
        onSessionChange={handleSessionChange}
        onClearCache={handleClearCache}
      />

      <div className="flex h-full w-full flex-1 flex-col px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
        <div className="flex items-center gap-3 mb-3">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 hover:bg-slate-100 rounded-lg transition"
            title="打开设置"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="flex-1">
            <ChatHeader
              title={title}
              user={user}
              tempUser={tempUser}
              onTempUserChange={setTempUser}
              onConfirmUser={() => setUser(tempUser.trim() || user)}
            />
          </div>
        </div>

        <div className="mb-3 flex justify-end">
          <a
            href="/storage"
            className="text-xs text-slate-600 hover:text-emerald-600 transition flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            文件存储
          </a>
        </div>

        <MessageList
          messages={messages}
          currentUser={user}
          connecting={connecting}
          error={error}
          messagesEndRef={messagesEndRef}
          onImageClick={(image) => setPreviewImage(image)}
          onDeleteMessage={handleDeleteMessage}
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


      </div>
      <ImagePreview image={previewImage} onClose={() => setPreviewImage(null)} />
    </main>
  );
}

