import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { HttpError } from "@/lib/rbac";

export function jsonOk<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

export function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export function handleRouteError(error: unknown) {
  if (error instanceof HttpError) {
    return jsonError(error.message, error.status);
  }
  if (error instanceof ZodError) {
    return jsonError(error.issues[0]?.message ?? "Invalid input", 422);
  }
  if (error instanceof Error) {
    return jsonError(error.message, 400);
  }
  return jsonError("Something went wrong", 500);
}
