import { autocompletePlaces } from "@/lib/places";
import { handleRouteError, jsonOk } from "@/lib/http";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const q = url.searchParams.get("q") ?? "";
    const suggestions = await autocompletePlaces(q);
    return jsonOk({ suggestions });
  } catch (error) {
    return handleRouteError(error);
  }
}
