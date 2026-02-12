import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const config = {
    TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN ? "已配置" : "未配置",
    TELEGRAM_CHAT_ID: process.env.TELEGRAM_CHAT_ID ? "已配置" : "未配置",
    tokenLength: process.env.TELEGRAM_BOT_TOKEN?.length || 0,
    chatIdValue: process.env.TELEGRAM_CHAT_ID || "未设置",
  };

  console.log("环境变量检查:", config);

  let apiTest = "未测试";
  try {
    console.log("测试 Telegram API 连接...");
    
    const response = await fetch("https://api.telegram.org/bot123456:test/getMe");
    
    apiTest = `API 可访问 (状态: ${response.status})`;
    console.log("API 测试结果:", apiTest);
  } catch (error) {
    apiTest = `API 连接失败: ${error instanceof Error ? error.message : "未知错误"}`;
    console.error("API 测试失败:", error);
  }

  return NextResponse.json({
    config,
    apiTest,
    message: "环境变量和网络连接测试完成",
  });
}
