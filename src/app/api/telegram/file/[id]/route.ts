import { NextRequest, NextResponse } from "next/server";
import {
  configureServerNetwork,
  getServerNetworkContext,
  serverFetch,
} from "@/lib/serverNetwork";

export const dynamic = "force-dynamic";

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

configureServerNetwork();

interface TelegramFileResponse {
  ok: boolean;
  result?: {
    file_path: string;
  };
}

function getReadableDownloadError(error: unknown) {
  const message = error instanceof Error ? error.message : "Unknown error";
  const cause = error instanceof Error ? error.cause : undefined;
  const network = getServerNetworkContext();

  if (cause && typeof cause === "object" && "code" in cause) {
    const code = String(cause.code);

    if (code === "UND_ERR_CONNECT_TIMEOUT") {
      return network.hasProxy
        ? `连接 Telegram 超时。当前已配置代理 ${network.proxyUrl}，但代理可能未启动或不可用。`
        : "连接 Telegram 超时。当前服务端未配置可用代理，国内网络环境下通常需要代理。";
    }

    if (code === "ECONNREFUSED") {
      return network.hasProxy
        ? `代理连接被拒绝：${network.proxyUrl}。请确认代理程序已启动。`
        : "连接被拒绝，请检查网络环境。";
    }
  }

  return `下载失败：${message}`;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: fileId } = await params;

  if (!TELEGRAM_BOT_TOKEN) {
    return NextResponse.json(
      { error: "Telegram 配置缺失" },
      { status: 500 },
    );
  }

  try {
    const getPathUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getFile?file_id=${fileId}`;
    const pathResponse = await serverFetch(getPathUrl);
    const pathData = (await pathResponse.json()) as TelegramFileResponse;

    if (!pathData.ok || !pathData.result) {
      return NextResponse.json(
        { error: "文件未找到或已过期" },
        { status: 404 },
      );
    }

    const filePath = pathData.result.file_path;
    const downloadUrl = `https://api.telegram.org/file/bot${TELEGRAM_BOT_TOKEN}/${filePath}`;
    const fileResponse = await serverFetch(downloadUrl);
    const fileBuffer = await fileResponse.arrayBuffer();

    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type":
          fileResponse.headers.get("content-type") ||
          "application/octet-stream",
        "Content-Disposition": `attachment; filename="${filePath.split("/").pop()}"`,
      },
    });
  } catch (error) {
    console.error("Download Error:", error);
    return NextResponse.json(
      { error: getReadableDownloadError(error) },
      { status: 500 },
    );
  }
}
