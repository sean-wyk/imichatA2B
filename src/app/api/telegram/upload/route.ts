import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

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

    const tgFormData = new FormData();
    tgFormData.append("document", file);
    tgFormData.append("chat_id", TELEGRAM_CHAT_ID);
    tgFormData.append("caption", `Uploaded: ${file.name}`);

    const tgUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendDocument`;

    const response = await fetch(tgUrl, {
      method: "POST",
      body: tgFormData,
    });

    const result = await response.json() as TelegramUploadResponse;

    if (!result.ok || !result.result) {
      console.error("Telegram Error:", result);
      return NextResponse.json(
        { error: result.description || "上传到 Telegram 失败" },
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
  } catch (error) {
    console.error("Upload Error:", error);
    
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    
    return NextResponse.json(
      { error: "上传失败：" + errorMessage },
      { status: 500 }
    );
  }
}
