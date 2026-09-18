import { getPublishedBySlug, toPublicCard } from "@/modules/properties";
import { handleRouteError, jsonError, jsonOk } from "@/lib/http";

export async function GET(
  _request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await context.params;
    const property = await getPublishedBySlug(slug);
    if (!property) return jsonError("Not found", 404);
    return jsonOk({ property: toPublicCard(property) });
  } catch (error) {
    return handleRouteError(error);
  }
}
