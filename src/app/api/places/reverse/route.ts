import { z } from "zod";
import { handleRouteError, jsonOk } from "@/lib/http";
import { osmReverse } from "@/lib/osm-geocode";

const schema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
});

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const { lat, lng } = schema.parse({ lat: url.searchParams.get("lat"), lng: url.searchParams.get("lng") });
    const place = await osmReverse(lat, lng).catch(() => null);
    return jsonOk({ place });
  } catch (error) {
    return handleRouteError(error);
  }
}
