"use client";

import { useState, useEffect } from "react";
import { FileUpload } from "@/components/telegram/FileUpload";
import { FileList } from "@/components/telegram/FileList";

export default function StoragePage() {
  const [userName, setUserName] = useState("");
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    const defaultName = `User${Math.floor(Math.random() * 9000) + 1000}`;
    setUserName(defaultName);
  }, []);

  const handleUploadSuccess = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <main className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-3xl font-bold text-slate-900">
              Telegram 云存储
            </h1>
            <a
              href="/"
              className="text-sm text-slate-600 hover:text-slate-900 transition"
            >
              返回聊天
            </a>
          </div>
          <p className="text-slate-600">
            上传文件到 Telegram，随时随地访问
          </p>
          <p className="text-xs text-slate-500 mt-1">
            当前用户：<span className="font-medium">{userName}</span>
          </p>
        </header>

        <div className="space-y-8">
          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-4">
              上传文件
            </h2>
            <FileUpload
              userName={userName}
              onUploadSuccess={handleUploadSuccess}
            />
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-4">
              已上传文件
            </h2>
            <FileList refreshTrigger={refreshTrigger} />
          </section>
        </div>
      </div>
    </main>
  );
}
