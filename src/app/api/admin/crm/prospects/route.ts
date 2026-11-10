import { createProspect, existingOwnerForPhone, prospectSchema } from "@/modules/crm";
import { handleRouteError, jsonOk } from "@/lib/http";
import { requireAdmin } from "@/lib/session";

export async function POST(request: Request) {
  try {
    const admin = await requireAdmin();
    const body = prospectSchema.parse(await request.json());
    const prospect = await createProspect(body, admin.id);
    const existingOwner = await existingOwnerForPhone(prospect.phone);
    return jsonOk({ prospect: { id: prospect.id }, existingOwner }, 201);
  } catch (error) {
    return handleRouteError(error);
  }
}
