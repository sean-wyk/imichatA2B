import { NextRequest, NextResponse } from "next/server";
import { FormData as UndiciFormData } from "undici";
import {
  configureServerNetwork,
  getServerNetworkContext,
  serverFetch,
} from "@/lib/serverNetwork";

export const dynamic = "force-dynamic";

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

configureServerNetwork();

interface TelegramUploadResponse {
  ok: boolean;
  result?: {
    document: {
      file_id: string;
      file_name: string;
      file_size: number;
    };
  };
  error_code?: number;
  description?: string;
}

function getReadableUploadError(error: unknown) {
  const message = error instanceof Error ? error.message : "Unknown error";
  const cause = error instanceof Error ? error.cause : undefined;
  const network = getServerNetworkContext();

  if (cause && typeof cause === "object" && "code" in cause) {
    const code = String(cause.code);

    if (code === "UND_ERR_CONNECT_TIMEOUT") {
      return network.hasProxy
        ? `连接 Telegram 超时。当前已配置代理 ${network.proxyUrl}，但代理可能未启动或无法访问外网。`
        : "连接 Telegram 超时。当前服务端未配置可用代理，国内网络环境下通常需要代理才能访问 Telegram。";
    }

    if (code === "ECONNREFUSED") {
      return network.hasProxy
        ? `代理连接被拒绝：${network.proxyUrl}。请确认本机代理程序已启动，且端口配置正确。`
        : "连接被拒绝，请检查网络环境。";
    }
  }

  return `上传失败：${message}`;
}

export async function POST(request: NextRequest) {
  try {
    if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
      console.error("Missing Telegram configuration:", {
        hasToken: !!TELEGRAM_BOT_TOKEN,
        hasChatId: !!TELEGRAM_CHAT_ID,
      });
      return NextResponse.json(
        {
          error:
            "Telegram 配置缺失，请在 .env 中配置 TELEGRAM_BOT_TOKEN 和 TELEGRAM_CHAT_ID",
        },
        { status: 500 },
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const fileBuffer = await file.arrayBuffer();
    const telegramFile = new Blob([fileBuffer], {
      type: file.type || "application/octet-stream",
    });

    const tgFormData = new UndiciFormData();
    tgFormData.append("document", telegramFile, file.name || "upload.bin");
    tgFormData.append("chat_id", TELEGRAM_CHAT_ID);
    tgFormData.append("caption", `Uploaded: ${file.name}`);

    const tgUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendDocument`;
    const response = await serverFetch(tgUrl, {
      method: "POST",
      body: tgFormData,
    });

    const result = (await response.json()) as TelegramUploadResponse;

    if (!result.ok || !result.result) {
      console.error("Telegram Error:", result);
      return NextResponse.json(
        { error: result.description || "上传到 Telegram 失败" },
        { status: 500 },
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
  } catch (error) {
    console.error("Upload Error:", error);

    return NextResponse.json(
      { error: getReadableUploadError(error) },
      { status: 500 },
    );
  }
}
