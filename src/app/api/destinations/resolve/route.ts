import { z } from "zod";
import { resolveDestination } from "@/modules/destinations";
import { handleRouteError, jsonOk } from "@/lib/http";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const parsed = z
      .object({ placeId: z.string(), label: z.string().optional() })
      .parse({
        placeId: url.searchParams.get("placeId") ?? "",
        label: url.searchParams.get("label") ?? undefined,
      });
    const place = await resolveDestination(parsed.placeId, parsed.label);
    return jsonOk({ place });
  } catch (error) {
    return handleRouteError(error);
  }
}
