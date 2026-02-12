"use client";

import { useState, useEffect } from "react";

interface Session {
  id: string;
  name: string;
  createdAt: string;
}

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  currentSession: string;
  onSessionChange: (sessionId: string) => void;
  onClearCache: () => void;
}

export function Sidebar({
  isOpen,
  onClose,
  currentSession,
  onSessionChange,
  onClearCache,
}: SidebarProps) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [newSessionName, setNewSessionName] = useState("");

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = () => {
    const stored = localStorage.getItem("chat-sessions");
    if (stored) {
      setSessions(JSON.parse(stored));
    } else {
      const defaultSession: Session = {
        id: "default",
        name: "默认会话",
        createdAt: new Date().toISOString(),
      };
      setSessions([defaultSession]);
      localStorage.setItem("chat-sessions", JSON.stringify([defaultSession]));
    }
  };

  const createSession = () => {
    if (!newSessionName.trim()) return;

    const newSession: Session = {
      id: `session-${Date.now()}`,
      name: newSessionName.trim(),
      createdAt: new Date().toISOString(),
    };

    const updated = [...sessions, newSession];
    setSessions(updated);
    localStorage.setItem("chat-sessions", JSON.stringify(updated));
    setNewSessionName("");
    onSessionChange(newSession.id);
  };

  const deleteSession = (sessionId: string) => {
    if (sessions.length === 1) {
      alert("无法删除最后一个会话");
      return;
    }

    if (!confirm("确定删除这个会话吗？")) return;

    const updated = sessions.filter((s) => s.id !== sessionId);
    setSessions(updated);
    localStorage.setItem("chat-sessions", JSON.stringify(updated));

    if (currentSession === sessionId) {
      onSessionChange(updated[0].id);
    }
  };

  const handleClearCache = async () => {
    if (!confirm("确定清空当前会话的所有消息吗？")) return;
    onClearCache();
  };

  return (
    <>
      <div
        className={`fixed inset-0 bg-black/50 z-40 transition-opacity ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      <aside
        className={`fixed left-0 top-0 h-full w-80 bg-white shadow-2xl z-50 transform transition-transform ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-4 border-b border-slate-200">
            <h2 className="text-lg font-semibold text-slate-900">设置</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 rounded-lg transition"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            <section>
              <h3 className="text-sm font-semibold text-slate-900 mb-3">
                会话管理
              </h3>
              <div className="space-y-2 mb-3">
                {sessions.map((session) => (
                  <div
                    key={session.id}
                    className={`flex items-center justify-between p-3 rounded-lg transition ${
                      currentSession === session.id
                        ? "bg-emerald-50 border border-emerald-200"
                        : "bg-slate-50 hover:bg-slate-100"
                    }`}
                  >
                    <button
                      onClick={() => onSessionChange(session.id)}
                      className="flex-1 text-left"
                    >
                      <p className="text-sm font-medium text-slate-900">
                        {session.name}
                      </p>
                      <p className="text-xs text-slate-500">
                        {new Date(session.createdAt).toLocaleDateString()}
                      </p>
                    </button>
                    {sessions.length > 1 && (
                      <button
                        onClick={() => deleteSession(session.id)}
                        className="p-1.5 hover:bg-red-100 rounded transition"
                      >
                        <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={newSessionName}
                  onChange={(e) => setNewSessionName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") createSession();
                  }}
                  placeholder="输入会话名称"
                  className="flex-1 px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-500"
                />
                <button
                  onClick={createSession}
                  disabled={!newSessionName.trim()}
                  className="px-4 py-2 bg-emerald-500 text-white text-sm font-medium rounded-lg hover:bg-emerald-600 disabled:bg-slate-300 disabled:cursor-not-allowed transition"
                >
                  创建
                </button>
              </div>
            </section>

            <section>
              <h3 className="text-sm font-semibold text-slate-900 mb-3">
                操作
              </h3>
              <div className="space-y-2">
                <button
                  onClick={handleClearCache}
                  className="w-full flex items-center gap-3 p-3 bg-red-50 hover:bg-red-100 rounded-lg transition text-left"
                >
                  <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-red-900">
                      清空消息
                    </p>
                    <p className="text-xs text-red-700">
                      删除当前会话的所有消息
                    </p>
                  </div>
                </button>

                <a
                  href="/storage"
                  className="w-full flex items-center gap-3 p-3 bg-sky-50 hover:bg-sky-100 rounded-lg transition text-left"
                >
                  <svg className="w-5 h-5 text-sky-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-sky-900">
                      文件存储
                    </p>
                    <p className="text-xs text-sky-700">
                      管理已上传的文件
                    </p>
                  </div>
                </a>
              </div>
            </section>
          </div>
        </div>
      </aside>
    </>
  );
}
