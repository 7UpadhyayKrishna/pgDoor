import { createPropertySchema, updateListing } from "@/modules/properties";
import { handleRouteError, jsonOk } from "@/lib/http";
import { requireOwner } from "@/lib/session";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await requireOwner();
    const body = createPropertySchema.parse(await request.json());
    const property = await updateListing(user.ownerProfileId, id, body, user.role === "ADMIN");
    return jsonOk({ property: { id: property.id, slug: property.slug, status: property.status } });
  } catch (error) {
    return handleRouteError(error);
  }
}
