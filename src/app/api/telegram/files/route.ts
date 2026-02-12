import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/redis";

export const dynamic = "force-dynamic";

const FILES_KEY = "telegram:files";

interface TelegramFile {
  id: string;
  fileId: string;
  fileName: string;
  fileSize: number;
  uploadedAt: string;
  uploadedBy: string;
}

export async function GET() {
  try {
    const files = await redis.lrange<TelegramFile | string>(FILES_KEY, 0, -1);
    const parsedFiles: TelegramFile[] = [];

    for (const item of files) {
      if (!item) continue;
      if (typeof item === "string") {
        try {
          parsedFiles.push(JSON.parse(item));
        } catch {
          continue;
        }
      } else {
        parsedFiles.push(item);
      }
    }

    return NextResponse.json({ files: parsedFiles.reverse() });
  } catch (error) {
    console.error("Failed to fetch files", error);
    return NextResponse.json({ files: [] });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { fileId, fileName, fileSize, uploadedBy } = await req.json();

    if (!fileId || !fileName) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const file: TelegramFile = {
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      fileId,
      fileName,
      fileSize: fileSize || 0,
      uploadedAt: new Date().toISOString(),
      uploadedBy: uploadedBy || "Anonymous",
    };

    await redis.rpush(FILES_KEY, file);

    return NextResponse.json({ success: true, file });
  } catch (error) {
    console.error("Failed to save file", error);
    return NextResponse.json(
      { error: "Failed to save file" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json();

    if (!id) {
      return NextResponse.json(
        { error: "Missing file id" },
        { status: 400 }
      );
    }

    const files = await redis.lrange<TelegramFile | string>(FILES_KEY, 0, -1);
    const parsedFiles: TelegramFile[] = [];

    for (const item of files) {
      if (!item) continue;
      if (typeof item === "string") {
        try {
          parsedFiles.push(JSON.parse(item));
        } catch {
          continue;
        }
      } else {
        parsedFiles.push(item);
      }
    }

    const filteredFiles = parsedFiles.filter((f) => f.id !== id);

    await redis.del(FILES_KEY);
    for (const file of filteredFiles) {
      await redis.rpush(FILES_KEY, file);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete file", error);
    return NextResponse.json(
      { error: "Failed to delete file" },
      { status: 500 }
    );
  }
}
