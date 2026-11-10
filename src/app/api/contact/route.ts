import { handleRouteError, jsonError, jsonOk } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";
import { createInboundProspect, inboundContactSchema } from "@/modules/crm";

export async function POST(request: Request) {
  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    if (!rateLimit(`contact:${ip}`, 5, 60 * 60 * 1000).ok) {
      return jsonError("Too many messages. Please try again later.", 429);
    }
    const input = inboundContactSchema.parse(await request.json());
    await createInboundProspect(input);
    return jsonOk({ ok: true }, 201);
  } catch (error) {
    return handleRouteError(error);
  }
}
