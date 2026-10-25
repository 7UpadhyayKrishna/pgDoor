const MAX_DIMENSION = 1600;
const JPEG_QUALITY = 0.82;
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

async function decode(file: File): Promise<CanvasImageSource & { width: number; height: number }> {
  if ("createImageBitmap" in window) {
    try {
      return await createImageBitmap(file, { imageOrientation: "from-image" });
    } catch {
      // Fall through to <img> decoding (older Safari).
    }
  }
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.decoding = "async";
    img.src = url;
    await img.decode();
    return img;
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** Resizes to at most 1600px on the long edge and re-encodes as JPEG so phone photos upload fast. */
export async function compressImage(file: File): Promise<Blob> {
  let source;
  try {
    source = await decode(file);
  } catch {
    throw new Error("This photo format isn't supported. Please use a JPG or PNG photo.");
  }
  const scale = Math.min(1, MAX_DIMENSION / Math.max(source.width, source.height));
  const width = Math.round(source.width * scale);
  const height = Math.round(source.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not process this photo");
  ctx.drawImage(source, 0, 0, width, height);
  if ("close" in source && typeof source.close === "function") source.close();

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY));
  if (!blob) throw new Error("Could not process this photo");
  if (blob.size > MAX_UPLOAD_BYTES) throw new Error("This photo is too large even after compressing");
  return blob;
}

function put(url: string, blob: Blob, onProgress: (pct: number) => void) {
  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    xhr.setRequestHeader("content-type", blob.type);
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress(Math.round((event.loaded / event.total) * 100));
    };
    xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error("Upload failed")));
    xhr.onerror = () => reject(new Error("Upload failed. Check your internet connection."));
    xhr.send(blob);
  });
}

export async function uploadPhoto(file: File, onProgress: (pct: number) => void) {
  const blob = await compressImage(file);
  const baseName = file.name.replace(/\.[^.]+$/, "") || "photo";
  const res = await fetch("/api/media/presign", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ fileName: `${baseName}.jpg`, mimeType: blob.type, size: blob.size }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Could not start the upload");
  await put(data.uploadUrl, blob, onProgress);
  return data.publicUrl as string;
}
