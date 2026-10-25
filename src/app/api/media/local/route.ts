import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { handleRouteError, jsonError } from "@/lib/http";
import { storageConfigured, validateImageUpload } from "@/lib/storage";

export async function PUT(request: Request) {
  try {
    if (storageConfigured() || process.env.NODE_ENV === "production") {
      return jsonError("Local uploads are disabled", 404);
    }
    const url = new URL(request.url);
    const key = url.searchParams.get("key");
    if (!key || key.includes("..") || !/^(drafts|properties)\//.test(key)) {
      return jsonError("Invalid key", 400);
    }
    if (key.startsWith("properties/")) {
      const user = await getCurrentUser();
      if (!user || (user.role !== "OWNER" && user.role !== "ADMIN")) {
        return jsonError("Owner access required", 403);
      }
    }

    const mimeType = request.headers.get("content-type") ?? "application/octet-stream";
    const buffer = Buffer.from(await request.arrayBuffer());
    validateImageUpload({ mimeType, size: buffer.length });

    const dest = path.join(process.cwd(), "public", "uploads", key);
    await mkdir(path.dirname(dest), { recursive: true });
    await writeFile(dest, buffer);
    return NextResponse.json({ url: `/uploads/${key}` });
  } catch (error) {
    return handleRouteError(error);
  }
}
