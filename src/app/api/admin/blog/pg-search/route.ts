import { handleRouteError, jsonOk } from "@/lib/http";
import { requireAdmin } from "@/lib/session";
import { searchPropertiesForEmbed } from "@/modules/blog";

export async function GET(request: Request) {
  try {
    await requireAdmin();
    const q = new URL(request.url).searchParams.get("q") ?? "";
    const results = await searchPropertiesForEmbed(q);
    return jsonOk({
      results: results.map((p) => ({
        id: p.id,
        slug: p.slug,
        name: p.name,
        minRent: p.minRent,
        place: `${p.area.name}, ${p.city.name}`,
      })),
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
