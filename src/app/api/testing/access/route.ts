import { createHash, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { z } from "zod";
import { handleRouteError, jsonError, jsonOk } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";
import { clientIp } from "@/lib/request";
import { TESTER_COOKIE, TESTER_PASSWORD, TESTER_TTL_DAYS, signTesterToken } from "@/lib/tester";

const ATTEMPTS_PER_WINDOW = 5;
const WINDOW_MS = 10 * 60 * 1000;

const accessSchema = z.object({ password: z.string().min(1, "Enter the tester password") });

function digest(value: string) {
  return createHash("sha256").update(value).digest();
}

export async function POST(request: Request) {
  try {
    const limited = rateLimit(`tester:${clientIp(request)}`, ATTEMPTS_PER_WINDOW, WINDOW_MS);
    if (!limited.ok) {
      return jsonError("Too many attempts. Try again in a few minutes.", 429);
    }

    const { password } = accessSchema.parse(await request.json());
    if (!timingSafeEqual(digest(password), digest(TESTER_PASSWORD))) {
      return jsonError("Wrong password", 401);
    }

    const jar = await cookies();
    jar.set(TESTER_COOKIE, await signTesterToken(), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: TESTER_TTL_DAYS * 24 * 60 * 60,
    });
    return jsonOk({ ok: true });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE() {
  const jar = await cookies();
  jar.delete(TESTER_COOKIE);
  return jsonOk({ ok: true });
}
