import { NextRequest, NextResponse } from "next/server";
import { ProxyAgent, fetch as undiciFetch } from "undici";

export const dynamic = "force-dynamic";

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const PROXY_URL = process.env.HTTPS_PROXY || process.env.HTTP_PROXY;

export async function POST(request: NextRequest) {
  try {
    if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
      console.error("Missing Telegram configuration:", {
        hasToken: !!TELEGRAM_BOT_TOKEN,
        hasChatId: !!TELEGRAM_CHAT_ID,
      });
      return NextResponse.json(
        { error: "Telegram 配置缺失，请在 .env 文件中配置 TELEGRAM_BOT_TOKEN 和 TELEGRAM_CHAT_ID" },
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "No file uploaded" },
        { status: 400 }
      );
    }

    // 将 File 转换为 Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 使用 undici 的 FormData
    const { FormData: UndiciFormData } = await import("undici");
    const tgFormData = new UndiciFormData();
    tgFormData.append("document", new Blob([buffer]), file.name);
    tgFormData.append("chat_id", TELEGRAM_CHAT_ID);
    tgFormData.append("caption", `Uploaded: ${file.name}`);

    const tgUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendDocument`;
    
    const fetchOptions: any = {
      method: "POST",
      body: tgFormData,
    };

    // 如果配置了代理，使用 ProxyAgent
    if (PROXY_URL) {
      console.log("Using proxy:", PROXY_URL);
      fetchOptions.dispatcher = new ProxyAgent(PROXY_URL);
    }

    try {
      const response = await undiciFetch(tgUrl, fetchOptions);

      const result = await response.json();

      if (!result.ok) {
        console.error("Telegram Error:", result);
        return NextResponse.json(
          { error: "上传到 Telegram 失败" },
          { status: 500 }
        );
      }

      const fileId = result.result.document.file_id;
      const fileName = result.result.document.file_name;
      const fileSize = result.result.document.file_size;

      return NextResponse.json({
        success: true,
        fileId,
        fileName,
        fileSize,
      });
    } catch (fetchError) {
      throw fetchError;
    }
  } catch (error) {
    console.error("Upload Error:", error);
    
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    
    if (errorMessage.includes("timeout") || errorMessage.includes("ETIMEDOUT")) {
      return NextResponse.json(
        { error: "连接 Telegram 超时，请检查网络或稍后重试" },
        { status: 504 }
      );
    }
    
    if (errorMessage.includes("ECONNREFUSED") || errorMessage.includes("fetch failed") || errorMessage.includes("connect")) {
      return NextResponse.json(
        { 
          error: PROXY_URL 
            ? `代理连接失败 (${PROXY_URL})，请检查：1) 代理软件是否运行 2) 端口是否正确（Clash 通常是 7890）` 
            : "无法连接到 Telegram API。如果在中国大陆，请配置代理：在 .env 中添加 HTTPS_PROXY=http://127.0.0.1:7890" 
        },
        { status: 503 }
      );
    }
    
    return NextResponse.json(
      { error: "上传失败：" + errorMessage },
      { status: 500 }
    );
  }
}
