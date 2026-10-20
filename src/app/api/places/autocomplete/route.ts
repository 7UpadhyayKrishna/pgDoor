import { autocompletePlaces } from "@/lib/places";
import { handleRouteError, jsonOk } from "@/lib/http";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const q = url.searchParams.get("q") ?? "";
    const forDestination = url.searchParams.get("destination") === "1";
    const suggestions = await autocompletePlaces(q, { forDestination });
    return jsonOk({ suggestions });
  } catch (error) {
    return handleRouteError(error);
  }
}
