import { searchFiltersSchema, searchProperties } from "@/modules/search";
import { handleRouteError, jsonOk } from "@/lib/http";
import { track, AnalyticsEvent } from "@/modules/analytics";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const amenities = url.searchParams.getAll("amenities");
    const parsed = searchFiltersSchema.parse({
      city: url.searchParams.get("city") ?? undefined,
      area: url.searchParams.get("area") ?? undefined,
      budgetMax: url.searchParams.get("budgetMax") ?? undefined,
      budgetMin: url.searchParams.get("budgetMin") ?? undefined,
      sharing: url.searchParams.get("sharing") ?? undefined,
      pgType: url.searchParams.get("pgType") ?? undefined,
      amenities: amenities.length ? amenities : undefined,
      food: url.searchParams.get("food") ?? undefined,
      availability: url.searchParams.get("availability") ?? undefined,
      availableFrom: url.searchParams.get("availableFrom") ?? undefined,
      sort: url.searchParams.get("sort") ?? undefined,
      page: url.searchParams.get("page") ?? undefined,
      near: url.searchParams.get("near") ?? undefined,
    });
    const result = await searchProperties(parsed);
    await track(AnalyticsEvent.search, parsed);
    return jsonOk(result);
  } catch (error) {
    return handleRouteError(error);
  }
}
