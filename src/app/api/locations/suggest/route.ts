import { suggestAreas } from "@/modules/locations";
import { handleRouteError, jsonOk } from "@/lib/http";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const q = url.searchParams.get("q") ?? "";
    const suggestions = await suggestAreas(q, 8);
    return jsonOk({ suggestions });
  } catch (error) {
    return handleRouteError(error);
  }
}
