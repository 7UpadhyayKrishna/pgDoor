import { suggestDestinations } from "@/modules/destinations";
import { handleRouteError, jsonOk } from "@/lib/http";

export async function GET(request: Request) {
  try {
    const q = new URL(request.url).searchParams.get("q") ?? "";
    const suggestions = await suggestDestinations(q);
    return jsonOk({ suggestions });
  } catch (error) {
    return handleRouteError(error);
  }
}
