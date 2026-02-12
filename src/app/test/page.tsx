"use client";

import { useState } from "react";

export default function TestPage() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const runTest = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/telegram/test");
      const data = await res.json();
      setResult(data);
    } catch (error) {
      setResult({ error: String(error) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-slate-900 mb-6">
          Telegram 配置测试
        </h1>

        <button
          onClick={runTest}
          disabled={loading}
          className="px-6 py-3 bg-emerald-500 text-white rounded-lg font-medium hover:bg-emerald-600 disabled:bg-slate-300 transition"
        >
          {loading ? "测试中..." : "开始测试"}
        </button>

        {result && (
          <div className="mt-6 space-y-4">
            <div className="bg-white rounded-lg p-6 shadow">
              <h2 className="text-xl font-semibold text-slate-900 mb-4">
                环境变量配置
              </h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600">TELEGRAM_BOT_TOKEN:</span>
                  <span className={`font-medium ${result.config?.TELEGRAM_BOT_TOKEN === "已配置" ? "text-green-600" : "text-red-600"}`}>
                    {result.config?.TELEGRAM_BOT_TOKEN}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Token 长度:</span>
                  <span className="font-medium text-slate-900">
                    {result.config?.tokenLength} 字符
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">TELEGRAM_CHAT_ID:</span>
                  <span className={`font-medium ${result.config?.TELEGRAM_CHAT_ID === "已配置" ? "text-green-600" : "text-red-600"}`}>
                    {result.config?.TELEGRAM_CHAT_ID}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Chat ID 值:</span>
                  <span className="font-medium text-slate-900">
                    {result.config?.chatIdValue}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-6 shadow">
              <h2 className="text-xl font-semibold text-slate-900 mb-4">
                网络连接测试
              </h2>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-slate-600 mb-1">API 测试:</p>
                  <p className={`text-sm font-medium ${result.apiTest?.includes("可访问") ? "text-green-600" : "text-red-600"}`}>
                    {result.apiTest}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-slate-100 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-slate-900 mb-4">
                完整响应
              </h2>
              <pre className="text-xs text-slate-700 overflow-auto">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-blue-900 mb-2">
                配置建议
              </h3>
              <ul className="text-sm text-blue-800 space-y-1">
                {result.config?.TELEGRAM_BOT_TOKEN === "未配置" && (
                  <li>• 请在 .env 文件中配置 TELEGRAM_BOT_TOKEN</li>
                )}
                {result.config?.TELEGRAM_CHAT_ID === "未配置" && (
                  <li>• 请在 .env 文件中配置 TELEGRAM_CHAT_ID</li>
                )}
                {result.apiTest?.includes("失败") && (
                  <li>• API 连接失败，请检查网络连接</li>
                )}
              </ul>
            </div>
          </div>
        )}

        <div className="mt-8">
          <a
            href="/"
            className="text-sm text-slate-600 hover:text-slate-900 transition"
          >
            ← 返回聊天
          </a>
        </div>
      </div>
    </main>
  );
}
