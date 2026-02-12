export async function uploadToImageHost(file: File) {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch("/api/upload-image", {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    throw new Error("上传失败");
  }

  const data = await res.json();
  const url = typeof data.url === "string" ? data.url : null;

  if (!url) {
    throw new Error("上传响应异常");
  }

  return url;
}

