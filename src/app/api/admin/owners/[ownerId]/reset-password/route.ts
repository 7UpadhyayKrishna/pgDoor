import { resetOwnerPassword } from "@/modules/admin-listing";
import { handleRouteError, jsonOk } from "@/lib/http";
import { requireAdmin } from "@/lib/session";

export async function POST(
  _request: Request,
  context: { params: Promise<{ ownerId: string }> },
) {
  try {
    const admin = await requireAdmin();
    const { ownerId } = await context.params;
    const credential = await resetOwnerPassword(ownerId, admin.id);
    return jsonOk({ credential });
  } catch (error) {
    return handleRouteError(error);
  }
}
