import type { KeyboardEvent } from "react";
import type { ChatAttachment } from "@/types/chat";

type MessageInputProps = {
  value: string;
  sending: boolean;
  canSend?: boolean;
  uploading?: boolean;
  attachments?: ChatAttachment[];
  onChange: (value: string) => void;
  onSend: () => void;
  onFilesSelected: (files: FileList | null) => void;
};

export function MessageInput({
  value,
  sending,
  canSend = false,
  uploading = false,
  attachments = [],
  onChange,
  onSend,
  onFilesSelected,
}: MessageInputProps) {
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!sending) {
        onSend();
      }
    }
  };

  const length = value.length;
  const max = 300;
  const nearLimit = length > max - 20;

  return (
    <footer className="mt-3 flex flex-col gap-2 border-t border-slate-200 pt-3">
      <div className="flex items-end gap-2">
        <div className="flex flex-1 flex-col gap-2">
          <textarea
            className="min-h-[64px] flex-1 resize-none rounded-2xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none ring-0 placeholder:text-slate-400 focus:border-emerald-500/80 focus:bg-white"
            placeholder="按 Enter 发送，Shift + Enter 换行"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            maxLength={max}
          />
          <div className="flex items-center gap-3 text-[11px] text-slate-400">
            <label className="inline-flex cursor-pointer items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-medium text-slate-600 hover:border-emerald-400 hover:bg-emerald-50 hover:text-emerald-700">
              <span>{uploading ? "上传中..." : "上传图片/文件"}</span>
              <input
                type="file"
                className="hidden"
                multiple
                onChange={(e) => {
                  onFilesSelected(e.target.files);
                  // 允许选择同一文件多次
                  e.target.value = "";
                }}
              />
            </label>
            {attachments.length > 0 && (
              <span className="text-xs text-emerald-600">
                已添加 {attachments.length} 个附件
              </span>
            )}
          </div>
        </div>
        <button
          className="h-[64px] w-24 shrink-0 rounded-2xl bg-emerald-500 text-sm font-medium text-white shadow-md transition hover:bg-emerald-400 hover:shadow-lg active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
          disabled={sending || !canSend}
          onClick={onSend}
        >
          {sending ? "发送中..." : "发送"}
        </button>
      </div>
      <div className="flex items-center justify-between text-[10px] text-slate-400">
        <span>公共聊天室，仅做实时通信演示使用。</span>
        <span className={nearLimit ? "text-amber-400" : ""}>
          {length}/{max}
        </span>
      </div>
    </footer>
  );
}

