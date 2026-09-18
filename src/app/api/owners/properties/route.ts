import { createListing, createPropertySchema, listOwnerProperties } from "@/modules/properties";
import { ensureOwnerProfile } from "@/modules/auth";
import { handleRouteError, jsonOk } from "@/lib/http";
import { requireOwner } from "@/lib/session";

export async function GET() {
  try {
    const user = await requireOwner();
    const ownerId = user.ownerProfileId ?? (await ensureOwnerProfile(user.id)).id;
    const properties = await listOwnerProperties(ownerId);
    return jsonOk({ properties });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireOwner();
    const owner = user.ownerProfileId
      ? { id: user.ownerProfileId }
      : await ensureOwnerProfile(user.id);
    const body = createPropertySchema.parse(await request.json());
    const property = await createListing(owner.id, body);
    return jsonOk({ property }, 201);
  } catch (error) {
    return handleRouteError(error);
  }
}
