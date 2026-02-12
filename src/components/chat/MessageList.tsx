import type { ChatAttachment, ChatMessage } from "@/types/chat";
import { useMemo } from "react";

type MessageListProps = {
  messages: ChatMessage[];
  currentUser: string;
  connecting: boolean;
  error: string | null;
  messagesEndRef: React.RefObject<HTMLDivElement>;
  onImageClick?: (image: ChatAttachment) => void;
};

function getInitial(name: string) {
  return name.trim().charAt(0) || "匿";
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
}: MessageListProps) {
  const hasMessages = messages.length > 0;

  const systemTips = useMemo(() => {
    if (connecting) {
      return "正在连接实时服务...";
    }
    if (error) {
      return `${error}（本地开发时请确保已在项目根目录配置 .env 环境变量）`;
    }
    if (!hasMessages) {
      return "暂无消息，发送一条消息开始聊天吧～";
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
                className={`flex flex-col gap-1 ${
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
                  className={`max-w-[80%] rounded-2xl px-3 py-2 text-xs leading-relaxed shadow-sm transition ${
                    isSelf
                      ? "bg-emerald-500 text-emerald-50 rounded-br-sm"
                      : "bg-white text-slate-900 rounded-bl-sm border border-slate-200"
                  }`}
                >
                  {msg.text}
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
                                    点击图片可放大 / 下载
                                  </span>
                                </button>
                              ) : hasUrl ? (
                                <a
                                  href={att.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] text-slate-700 hover:border-emerald-400 hover:text-emerald-700"
                                >
                                  {att.name || "附件"}
                                </a>
                              ) : (
                                <span className="inline-flex items-center rounded-full border border-dashed border-slate-200 bg-slate-50 px-2 py-1 text-[11px] text-slate-500">
                                  {att.name || "附件"}（当前仅在本地展示名称）
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

