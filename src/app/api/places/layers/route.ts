import { z } from "zod";
import { fetchMapLayerPois, type MapPoiLayer } from "@/lib/places";
import { handleRouteError, jsonOk } from "@/lib/http";

const schema = z.object({
  lat: z.coerce.number(),
  lng: z.coerce.number(),
  layers: z.string().optional(),
  radius: z.coerce.number().optional(),
});

const VALID_LAYERS: MapPoiLayer[] = ["transport", "daily", "lifestyle", "essentials"];

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const parsed = schema.parse({
      lat: url.searchParams.get("lat"),
      lng: url.searchParams.get("lng"),
      layers: url.searchParams.get("layers") ?? undefined,
      radius: url.searchParams.get("radius") ?? undefined,
    });

    const requested = (parsed.layers ?? "transport,daily")
      .split(",")
      .map((s) => s.trim())
      .filter((s): s is MapPoiLayer => VALID_LAYERS.includes(s as MapPoiLayer));

    const layers = requested.length ? requested : (["transport", "daily"] as MapPoiLayer[]);
    const pois = await fetchMapLayerPois({
      lat: parsed.lat,
      lng: parsed.lng,
      layers,
      radiusMeters: parsed.radius ?? 1500,
    });

    return jsonOk({ pois });
  } catch (error) {
    return handleRouteError(error);
  }
}
