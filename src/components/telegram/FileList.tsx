"use client";

import { useEffect, useState } from "react";

interface TelegramFile {
  id: string;
  fileId: string;
  fileName: string;
  fileSize: number;
  uploadedAt: string;
  uploadedBy: string;
}

interface FileListProps {
  refreshTrigger: number;
}

export function FileList({ refreshTrigger }: FileListProps) {
  const [files, setFiles] = useState<TelegramFile[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFiles = async () => {
    try {
      const res = await fetch("/api/telegram/files");
      const data = await res.json();
      setFiles(data.files || []);
    } catch (error) {
      console.error("Failed to fetch files:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, [refreshTrigger]);

  const handleDelete = async (id: string) => {
    if (!confirm("确定删除这个文件吗？")) return;

    try {
      await fetch("/api/telegram/files", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id }),
      });
      fetchFiles();
    } catch (error) {
      console.error("Failed to delete file:", error);
    }
  };

  const handleShareToChat = async (file: TelegramFile) => {
    try {
      const downloadUrl = `${window.location.origin}/api/telegram/file/${file.fileId}`;
      const message = `📎 **文件分享**\n\n**名称：** ${file.fileName}\n**大小：** ${formatFileSize(file.fileSize)}\n**下载：** ${downloadUrl}`;
      
      await navigator.clipboard.writeText(downloadUrl);
      alert(`下载链接已复制到剪贴板！\n\n你可以粘贴到聊天中或分享给其他人。`);
    } catch (error) {
      console.error("Failed to share file:", error);
      alert("复制链接失败");
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  if (loading) {
    return (
      <div className="text-center py-8 text-slate-500">加载中...</div>
    );
  }

  if (files.length === 0) {
    return (
      <div className="text-center py-8 text-slate-500">
        暂无文件
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {files.map((file) => (
        <div
          key={file.id}
          className="flex items-center justify-between bg-white border border-slate-200 rounded-xl p-4 hover:shadow-md transition group"
        >
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-medium text-slate-900 truncate">
              {file.fileName}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              {formatFileSize(file.fileSize)} • {file.uploadedBy} •{" "}
              {formatDate(file.uploadedAt)}
            </p>
          </div>
          <div className="flex items-center gap-2 ml-4">
            <button
              onClick={() => handleShareToChat(file)}
              className="px-3 py-1.5 text-xs font-medium text-sky-700 bg-sky-50 rounded-full hover:bg-sky-100 transition"
              title="分享到聊天"
            >
              分享
            </button>
            <a
              href={`/api/telegram/file/${file.fileId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 rounded-full hover:bg-emerald-100 transition"
            >
              下载
            </a>
            <button
              onClick={() => handleDelete(file.id)}
              className="px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 rounded-full hover:bg-red-100 transition"
            >
              删除
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
