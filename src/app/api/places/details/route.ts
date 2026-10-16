import { getPlaceDetails } from "@/lib/places";
import { handleRouteError, jsonOk, jsonError } from "@/lib/http";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const placeId = url.searchParams.get("placeId");
    if (!placeId) return jsonError("placeId is required", 400);
    const place = await getPlaceDetails(placeId);
    return jsonOk({ place });
  } catch (error) {
    return handleRouteError(error);
  }
}
