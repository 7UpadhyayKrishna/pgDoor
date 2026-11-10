import { adminOwnerSchema, createOwnerWithCredentials } from "@/modules/admin-listing";
import { handleRouteError, jsonOk } from "@/lib/http";
import { requireAdmin } from "@/lib/session";

export async function POST(request: Request) {
  try {
    const admin = await requireAdmin();
    const body = adminOwnerSchema.parse(await request.json());
    const owner = await createOwnerWithCredentials(body, admin.id);
    return jsonOk({ owner }, owner.existing ? 200 : 201);
  } catch (error) {
    return handleRouteError(error);
  }
}
