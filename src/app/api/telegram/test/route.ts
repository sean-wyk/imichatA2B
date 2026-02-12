import { NextResponse } from "next/server";
import { ProxyAgent, fetch as undiciFetch } from "undici";

export const dynamic = "force-dynamic";

export async function GET() {
  const config = {
    TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN ? "已配置" : "未配置",
    TELEGRAM_CHAT_ID: process.env.TELEGRAM_CHAT_ID ? "已配置" : "未配置",
    HTTPS_PROXY: process.env.HTTPS_PROXY || "未配置",
    HTTP_PROXY: process.env.HTTP_PROXY || "未配置",
    tokenLength: process.env.TELEGRAM_BOT_TOKEN?.length || 0,
    chatIdValue: process.env.TELEGRAM_CHAT_ID || "未设置",
  };

  console.log("环境变量检查:", config);

  // 测试代理连接
  let proxyTest = "未测试";
  const PROXY_URL = process.env.HTTPS_PROXY || process.env.HTTP_PROXY;
  
  if (PROXY_URL) {
    try {
      console.log("测试代理连接:", PROXY_URL);
      const proxyAgent = new ProxyAgent(PROXY_URL);
      
      const response = await undiciFetch("https://api.telegram.org/bot123456:test/getMe", {
        dispatcher: proxyAgent,
      });
      
      proxyTest = `代理可访问 (状态: ${response.status})`;
      console.log("代理测试结果:", proxyTest);
    } catch (error) {
      proxyTest = `代理连接失败: ${error instanceof Error ? error.message : "未知错误"}`;
      console.error("代理测试失败:", error);
    }
  }

  // 测试直连
  let directTest = "未测试";
  try {
    console.log("测试直连 Telegram API...");
    
    const response = await undiciFetch("https://api.telegram.org/bot123456:test/getMe");
    
    directTest = `直连可访问 (状态: ${response.status})`;
    console.log("直连测试结果:", directTest);
  } catch (error) {
    directTest = `直连失败: ${error instanceof Error ? error.message : "未知错误"}`;
    console.error("直连测试失败:", error);
  }

  return NextResponse.json({
    config,
    proxyTest,
    directTest,
    message: "环境变量和网络连接测试完成",
  });
}
