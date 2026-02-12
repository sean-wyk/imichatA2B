import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

interface TelegramFileResponse {
  ok: boolean;
  result?: {
    file_path: string;
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: fileId } = await params;

  if (!TELEGRAM_BOT_TOKEN) {
    return NextResponse.json(
      { error: "Telegram 配置缺失" },
      { status: 500 }
    );
  }

  try {
    const getPathUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getFile?file_id=${fileId}`;
    
    const pathResponse = await fetch(getPathUrl);
    const pathData = await pathResponse.json() as TelegramFileResponse;

    if (!pathData.ok || !pathData.result) {
      return NextResponse.json(
        { error: "文件未找到或已过期" },
        { status: 404 }
      );
    }

    const filePath = pathData.result.file_path;
    const downloadUrl = `https://api.telegram.org/file/bot${TELEGRAM_BOT_TOKEN}/${filePath}`;

    const fileResponse = await fetch(downloadUrl);
    const fileBuffer = await fileResponse.arrayBuffer();

    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": fileResponse.headers.get("content-type") || "application/octet-stream",
        "Content-Disposition": `attachment; filename="${filePath.split('/').pop()}"`,
      },
    });
  } catch (error) {
    console.error("Download Error:", error);
    return NextResponse.json(
      { error: "下载失败：" + (error instanceof Error ? error.message : "未知错误") },
      { status: 500 }
    );
  }
}
