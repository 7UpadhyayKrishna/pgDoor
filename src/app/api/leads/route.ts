import { createEnquiry, createLeadSchema, listOwnerLeads, listSeekerLeads } from "@/modules/leads";
import { handleRouteError, jsonOk } from "@/lib/http";
import { getCurrentUser, requireOwner, requireUser } from "@/lib/session";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return jsonOk({ leads: [] });
    if (user.ownerProfileId) {
      const leads = await listOwnerLeads(user.ownerProfileId);
      return jsonOk({ leads });
    }
    const leads = await listSeekerLeads(user.id);
    return jsonOk({ leads });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const body = createLeadSchema.parse(await request.json());
    const lead = await createEnquiry(user.id, user.phoneVerified, body);
    return jsonOk({ lead }, 201);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH() {
  try {
    await requireOwner();
    return jsonOk({ ok: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
