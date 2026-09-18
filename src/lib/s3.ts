/**
 * S3 / R2 adapter. Local fallback stores under /uploads for V1 without cloud credentials.
 */
const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_BYTES = 5 * 1024 * 1024;

export function s3Configured() {
  return Boolean(process.env.S3_BUCKET && process.env.S3_ACCESS_KEY_ID);
}

export function validateImageUpload(input: { mimeType: string; size: number }) {
  if (!ALLOWED_MIME.has(input.mimeType)) {
    throw new Error("Only JPEG, PNG and WebP images are allowed");
  }
  if (input.size > MAX_BYTES) {
    throw new Error("Images must be 5 MB or smaller");
  }
}

export async function createPresignedUpload(input: {
  fileName: string;
  mimeType: string;
  size: number;
}) {
  validateImageUpload(input);
  const key = `properties/${Date.now()}-${slugSafe(input.fileName)}`;

  if (!s3Configured()) {
    return {
      uploadUrl: `/api/media/local?key=${encodeURIComponent(key)}`,
      publicUrl: `/uploads/${key}`,
      key,
      method: "PUT" as const,
      provider: "local" as const,
    };
  }

  const publicBase = process.env.S3_PUBLIC_URL?.replace(/\/$/, "") ?? "";
  return {
    uploadUrl: `${publicBase}/${key}`,
    publicUrl: `${publicBase}/${key}`,
    key,
    method: "PUT" as const,
    provider: "s3" as const,
  };
}

function slugSafe(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]+/g, "-").toLowerCase();
}
