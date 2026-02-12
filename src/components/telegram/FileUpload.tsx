"use client";

import { useState } from "react";

interface FileUploadProps {
  userName: string;
  onUploadSuccess: () => void;
}

export function FileUpload({ userName, onUploadSuccess }: FileUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadedFile, setUploadedFile] = useState<{
    fileName: string;
    fileId: string;
  } | null>(null);

  const handleUpload = async () => {
    if (!file) return;

    // Telegram Bot API 限制：50 MB
    const MAX_FILE_SIZE = 50 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      alert(`文件大小超过限制！Telegram Bot API 最大支持 50 MB，当前文件：${formatFileSize(file.size)}`);
      return;
    }

    setUploading(true);
    setProgress(0);
    setUploadedFile(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      setProgress(30);
      const uploadRes = await fetch("/api/telegram/upload", {
        method: "POST",
        body: formData,
      });

      const uploadData = await uploadRes.json();

      if (!uploadData.success) {
        throw new Error(uploadData.error || "Upload failed");
      }

      setProgress(60);

      await fetch("/api/telegram/files", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fileId: uploadData.fileId,
          fileName: uploadData.fileName,
          fileSize: uploadData.fileSize,
          uploadedBy: userName,
        }),
      });

      setProgress(100);
      setUploadedFile({
        fileName: uploadData.fileName,
        fileId: uploadData.fileId,
      });
      
      setTimeout(() => {
        setFile(null);
        setUploadedFile(null);
        onUploadSuccess();
      }, 3000);
    } catch (error) {
      console.error("Upload error:", error);
      alert("Upload failed: " + (error as Error).message);
    } finally {
      setUploading(false);
      setTimeout(() => setProgress(0), 1000);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
  };

  return (
    <div className="border-2 border-dashed border-slate-300 rounded-2xl p-6 bg-slate-50">
      <div className="flex flex-col gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            选择文件 <span className="text-xs text-slate-500">(最大 50 MB)</span>
          </label>
          <input
            type="file"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
            disabled={uploading}
          />
          {file && (
            <p className="mt-2 text-xs text-slate-500">
              {file.name} ({formatFileSize(file.size)})
              {file.size > 50 * 1024 * 1024 && (
                <span className="text-red-600 ml-2">⚠️ 超过 50 MB 限制</span>
              )}
            </p>
          )}
        </div>

        {uploading && (
          <div className="w-full bg-slate-200 rounded-full h-2">
            <div
              className="bg-emerald-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}

        {uploadedFile && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <div className="flex-1">
                <p className="text-sm font-medium text-emerald-900">
                  上传成功！
                </p>
                <p className="text-xs text-emerald-700 mt-1">
                  {uploadedFile.fileName} 已上传到 Telegram
                </p>
              </div>
            </div>
          </div>
        )}

        <button
          onClick={handleUpload}
          disabled={!file || uploading}
          className="w-full bg-emerald-500 text-white px-4 py-2 rounded-full font-medium transition hover:bg-emerald-600 disabled:bg-slate-300 disabled:cursor-not-allowed"
        >
          {uploading ? "上传中..." : "上传到 Telegram"}
        </button>
      </div>
    </div>
  );
}
