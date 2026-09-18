import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { requireOwner } from "@/lib/session";
import { handleRouteError, jsonError } from "@/lib/http";
import { validateImageUpload } from "@/lib/s3";

export async function PUT(request: Request) {
  try {
    await requireOwner();
    const url = new URL(request.url);
    const key = url.searchParams.get("key");
    if (!key || key.includes("..")) return jsonError("Invalid key", 400);

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
