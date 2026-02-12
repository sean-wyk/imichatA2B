import type { ChatAttachment, ChatMessage } from "@/types/chat";
import { useMemo, useState } from "react";
import { MessageContent } from "./MessageContent";

type MessageListProps = {
  messages: ChatMessage[];
  currentUser: string;
  connecting: boolean;
  error: string | null;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  onImageClick?: (image: ChatAttachment) => void;
  onDeleteMessage?: (messageId: string) => void;
};

function getInitial(name: string) {
  return name.trim().charAt(0) || "?";
}

function getAvatarColor(name: string) {
  const colors = [
    "bg-emerald-500/20 text-emerald-200",
    "bg-sky-500/20 text-sky-200",
    "bg-violet-500/20 text-violet-200",
    "bg-amber-500/20 text-amber-200",
    "bg-pink-500/20 text-pink-200",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash + name.charCodeAt(i) * (i + 1)) % colors.length;
  }
  return colors[hash] ?? colors[0];
}

export function MessageList({
  messages,
  currentUser,
  connecting,
  error,
  messagesEndRef,
  onImageClick,
  onDeleteMessage,
}: MessageListProps) {
  const hasMessages = messages.length > 0;
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = async (text: string, messageId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(messageId);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error("Failed to copy", err);
    }
  };

  const systemTips = useMemo(() => {
    if (connecting) {
      return "Connecting...";
    }
    if (error) {
      return `${error}`;
    }
    if (!hasMessages) {
      return "No messages yet. Send one to start chatting!";
    }
    return "";
  }, [connecting, error, hasMessages]);

  return (
    <section className="flex-1 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
      <div className="flex h-full flex-col">
        <div className="flex-1 space-y-3 overflow-y-auto p-4 text-sm scrollbar-thin scrollbar-track-transparent scrollbar-thumb-slate-300">
          {systemTips && (
            <p
              className={`text-xs ${
                error ? "text-red-500" : "text-slate-400"
              } text-center`}
            >
              {systemTips}
            </p>
          )}

          {messages.map((msg) => {
            const isSelf = msg.user === currentUser;
            const avatarColor = getAvatarColor(msg.user);
            const time = new Date(msg.createdAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            });

            return (
              <div
                key={msg.id}
                className={`flex flex-col gap-1 group ${
                  isSelf ? "items-end" : "items-start"
                }`}
              >
                <div
                  className={`flex items-baseline gap-2 ${
                    isSelf ? "flex-row-reverse" : "flex-row"
                  }`}
                >
                  <div
                    className={`flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-semibold ${avatarColor}`}
                  >
                    {getInitial(msg.user)}
                  </div>
                  <div className="flex flex-col">
                    <span
                      className={`text-xs font-medium ${
                        isSelf ? "text-emerald-600" : "text-sky-600"
                      }`}
                    >
                      {msg.user}
                    </span>
                    <span className="text-[10px] text-slate-400">{time}</span>
                  </div>
                </div>
                <div
                  className={`max-w-[80%] rounded-2xl px-3 py-2 shadow-sm transition ${
                    isSelf
                      ? "bg-emerald-600 text-white rounded-br-sm"
                      : "bg-white text-slate-900 rounded-bl-sm border border-slate-200"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      {msg.text && <MessageContent content={msg.text} isSelf={isSelf} />}
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => handleCopy(msg.text, msg.id)}
                        className={`p-1 rounded hover:bg-black/10 transition ${
                          copiedId === msg.id ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                        }`}
                        title="Copy message"
                      >
                        {copiedId === msg.id ? (
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        )}
                      </button>
                      {isSelf && onDeleteMessage && (
                        <button
                          onClick={() => {
                            if (confirm("Delete this message?")) {
                              onDeleteMessage(msg.id);
                            }
                          }}
                          className="p-1 rounded hover:bg-black/10 transition opacity-0 group-hover:opacity-100"
                          title="Delete message"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                  {Array.isArray(msg.attachments) &&
                    msg.attachments.length > 0 && (
                      <div className="mt-2 space-y-2">
                        {msg.attachments.map((att: ChatAttachment) => {
                          const isImage = att.type === "image";
                          const hasUrl = !!att.url;
                          return (
                            <div key={`${att.url}-${att.name}`}>
                              {isImage && hasUrl ? (
                                <button
                                  type="button"
                                  onClick={() => onImageClick?.(att)}
                                  className="group w-full cursor-zoom-in"
                                >
                                  <img
                                    src={att.url}
                                    alt={att.name}
                                    className="max-h-48 w-full rounded-xl border border-slate-200 bg-slate-50 object-contain transition group-hover:border-emerald-400"
                                  />
                                  <span className="mt-1 block text-[10px] text-slate-400 opacity-0 group-hover:opacity-100">
                                    Click to enlarge
                                  </span>
                                </button>
                              ) : hasUrl ? (
                                <a
                                  href={att.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] text-slate-700 hover:border-emerald-400 hover:text-emerald-700"
                                >
                                  {att.name || "File"}
                                </a>
                              ) : (
                                <span className="inline-flex items-center rounded-full border border-dashed border-slate-200 bg-slate-50 px-2 py-1 text-[11px] text-slate-500">
                                  {att.name || "File"}
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
      </div>
    </section>
  );
}

