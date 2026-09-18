import { NextResponse } from "next/server";
import { logout } from "@/modules/auth";
import { handleRouteError, jsonOk } from "@/lib/http";

export async function POST(request: Request) {
  try {
    await logout();
    if (request.headers.get("accept")?.includes("text/html")) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return jsonOk({ ok: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
