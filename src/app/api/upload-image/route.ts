import { NextRequest, NextResponse } from "next/server";

const IMAGE_UPLOAD_ENDPOINT =
  process.env.NEXT_PUBLIC_IMAGE_UPLOAD_ENDPOINT ||
  "https://images.wykplus.online/upload";
const IMAGE_BASE_URL =
  process.env.NEXT_PUBLIC_IMAGE_BASE_URL || "https://images.wykplus.online";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!file || typeof file === "string") {
      return NextResponse.json({ error: "缺少文件" }, { status: 400 });
    }

    const upstreamForm = new FormData();
    upstreamForm.append("file", file);

    const res = await fetch(IMAGE_UPLOAD_ENDPOINT, {
      method: "POST",
      body: upstreamForm,
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.error("上游图床上传失败", res.status, text);
      return NextResponse.json({ error: "图床上传失败" }, { status: 502 });
    }

    const data = await res.json();
    const src =
      Array.isArray(data) && data.length > 0 && data[0] && typeof data[0].src === "string"
        ? data[0].src
        : null;

    if (!src) {
      return NextResponse.json({ error: "图床响应异常" }, { status: 502 });
    }

    const normalizedBase = IMAGE_BASE_URL.replace(/\/$/, "");
    const url = `${normalizedBase}${src}`;

    return NextResponse.json({ url });
  } catch (error) {
    console.error("上传图片接口异常", error);
    return NextResponse.json({ error: "上传图片失败" }, { status: 500 });
  }
}

