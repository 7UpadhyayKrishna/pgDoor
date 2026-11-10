import { z } from "zod";
import { handleRouteError, jsonOk } from "@/lib/http";
import { parseCoordinates } from "@/lib/map-link";
import { HttpError } from "@/lib/rbac";
import { rateLimit } from "@/lib/rate-limit";
import { clientIp } from "@/lib/request";

const schema = z.object({ url: z.string().url().max(2000) });
const ALLOWED_HOSTS = /^(maps\.app\.goo\.gl|goo\.gl|(www\.|maps\.)?google\.[a-z.]+)$/i;
const MAX_HOPS = 5;

/** Expands a Google Maps share link and returns the pin's coordinates. */
export async function POST(request: Request) {
  try {
    if (!rateLimit(`maplink:${clientIp(request)}`, 30, 60 * 1000).ok) {
      throw new HttpError(429, "Too many links. Try again in a minute.");
    }
    let url = new URL(schema.parse(await request.json()).url);

    for (let hop = 0; hop <= MAX_HOPS; hop += 1) {
      if (url.protocol !== "https:" || !ALLOWED_HOSTS.test(url.hostname)) {
        throw new HttpError(400, "Paste a Google Maps link");
      }
      const coords = parseCoordinates(url.toString());
      if (coords) return jsonOk(coords);

      const res = await fetch(url, { redirect: "manual", headers: { "user-agent": "Mozilla/5.0" } });
      const location = res.headers.get("location");
      if (!location) break;
      url = new URL(location, url);
    }
    throw new HttpError(422, "Couldn't find a pin in that link. Open it in Google Maps and copy the coordinates.");
  } catch (error) {
    return handleRouteError(error);
  }
}
