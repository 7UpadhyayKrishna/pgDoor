import { randomUUID } from "crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { HttpError } from "@/lib/rbac";

/**
 * Supabase Storage adapter for listing photos. Without Supabase credentials (local dev) files are
 * written under public/uploads via /api/media/local, which does not persist on Vercel.
 */
export const ALLOWED_IMAGE_MIME = ["image/jpeg", "image/png", "image/webp"] as const;
const MAX_BYTES = 5 * 1024 * 1024;

export type UploadScope = "drafts" | "properties";

let client: SupabaseClient | null = null;

function bucket() {
  return process.env.SUPABASE_STORAGE_BUCKET || "pg-photos";
}

export function storageConfigured() {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

function supabase() {
  if (!client) {
    client = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return client;
}

export function publicPhotoBase() {
  if (!storageConfigured()) return "/uploads/";
  const base = process.env.SUPABASE_URL!.replace(/\/$/, "");
  return `${base}/storage/v1/object/public/${bucket()}/`;
}

export function isAllowedPhotoUrl(url: string) {
  if (url.startsWith(publicPhotoBase())) return true;
  return process.env.NODE_ENV !== "production" && url.startsWith("/uploads/");
}

export function validateImageUpload(input: { mimeType: string; size: number }) {
  if (!(ALLOWED_IMAGE_MIME as readonly string[]).includes(input.mimeType)) {
    throw new HttpError(400, "Only JPEG, PNG and WebP images are allowed");
  }
  if (input.size > MAX_BYTES) {
    throw new HttpError(400, "Images must be 5 MB or smaller");
  }
}

export async function createPhotoUpload(input: {
  fileName: string;
  mimeType: string;
  size: number;
  scope: UploadScope;
}) {
  validateImageUpload(input);
  const month = new Date().toISOString().slice(0, 7);
  const path = `${input.scope}/${month}/${randomUUID()}-${slugSafe(input.fileName)}`;

  if (!storageConfigured()) {
    if (process.env.NODE_ENV === "production") {
      throw new HttpError(503, "Photo uploads are not configured yet");
    }
    return {
      uploadUrl: `/api/media/local?key=${encodeURIComponent(path)}`,
      publicUrl: `/uploads/${path}`,
      path,
      method: "PUT" as const,
      provider: "local" as const,
    };
  }

  const { data, error } = await supabase().storage.from(bucket()).createSignedUploadUrl(path);
  if (error || !data) {
    throw new HttpError(502, "Could not prepare the photo upload. Please try again.");
  }
  return {
    uploadUrl: data.signedUrl,
    publicUrl: `${publicPhotoBase()}${path}`,
    path,
    method: "PUT" as const,
    provider: "supabase" as const,
  };
}

function slugSafe(name: string) {
  const cleaned = name.replace(/[^a-zA-Z0-9._-]+/g, "-").toLowerCase().slice(-60);
  return cleaned || "photo.jpg";
}
