import { getNearbyForArea } from "@/modules/locations";
import { handleRouteError, jsonError, jsonOk } from "@/lib/http";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const areaId = url.searchParams.get("areaId");
    if (!areaId) return jsonError("areaId is required", 400);

    const nearby = await getNearbyForArea(areaId);
    if (!nearby) return jsonOk({ areaName: null, places: [] });
    return jsonOk(nearby);
  } catch (error) {
    return handleRouteError(error);
  }
}
