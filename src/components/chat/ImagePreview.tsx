import type { ChatAttachment } from "@/types/chat";

type ImagePreviewProps = {
  image: ChatAttachment | null;
  onClose: () => void;
};

export function ImagePreview({ image, onClose }: ImagePreviewProps) {
  if (!image || image.type !== "image" || !image.url) return null;

  const fileName = image.name || "图片预览";

  const handleDownload = () => {
    try {
      const link = document.createElement("a");
      link.href = image.url;
      link.download = fileName;
      link.target = "_blank";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch {
      // 安静失败，用户仍可使用“新窗口打开”
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="mx-4 flex max-h-[90vh] max-w-[90vw] flex-col gap-3"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={image.url}
          alt={fileName}
          className="max-h-[80vh] max-w-[90vw] rounded-xl bg-slate-900 object-contain"
        />
        <div className="flex items-center justify-between gap-3 text-xs text-slate-100">
          <span className="max-w-[40vw] truncate opacity-80">{fileName}</span>
          <div className="flex items-center gap-2">
            <a
              href={image.url}
              target="_blank"
              rel="noreferrer"
              className="rounded-full bg-white/10 px-2 py-1 text-[11px] hover:bg-white/20"
            >
              新窗口打开
            </a>
            <button
              type="button"
              onClick={handleDownload}
              className="rounded-full bg-emerald-500 px-2 py-1 text-[11px] font-medium text-slate-900 hover:bg-emerald-400"
            >
              下载
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full bg-white/10 px-2 py-1 text-[11px] hover:bg-white/20"
            >
              关闭
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

