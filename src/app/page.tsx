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

  const title = useMemo(() => "Chat Room", []);

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

        if (isImage) {
          const url = await uploadToImageHost(file);
          uploaded.push({
            url,
            name: file.name,
            type: "image",
          });
        } else {
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
      setError("Upload failed, please try again");
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

