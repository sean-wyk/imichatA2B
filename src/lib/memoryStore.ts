import type { ChatMessage } from "@/types/chat";

// 进程级内存存储，仅在当前服务器进程存活期间有效
let messages: ChatMessage[] = [];

function isToday(dateString: string) {
  const d = new Date(dateString);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

export function addMessageToMemory(message: ChatMessage) {
  // 只保留当天的消息
  if (!isToday(message.createdAt)) return;

  messages.push(message);

  // 每次写入时顺便清理掉非当天的数据，防止越存越多
  messages = messages.filter((m) => isToday(m.createdAt));
}

export function getTodayMessages(): ChatMessage[] {
  const today = messages.filter((m) => isToday(m.createdAt));
  // 防御：读的时候也顺便清理一次
  messages = today;
  return today;
}

