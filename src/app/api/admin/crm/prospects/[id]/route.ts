import { existingOwnerForPhone, prospectSchema, updateProspect } from "@/modules/crm";
import { handleRouteError, jsonOk } from "@/lib/http";
import { requireAdmin } from "@/lib/session";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin();
    const { id } = await context.params;
    const body = prospectSchema.parse(await request.json());
    const prospect = await updateProspect(id, body);
    const existingOwner = await existingOwnerForPhone(prospect.phone);
    return jsonOk({ prospect: { id: prospect.id }, existingOwner });
  } catch (error) {
    return handleRouteError(error);
  }
}
