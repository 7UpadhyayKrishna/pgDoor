import { createVisitSchema, requestVisit } from "@/modules/leads";
import { handleRouteError, jsonOk } from "@/lib/http";
import { requireUser } from "@/lib/session";

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const body = createVisitSchema.parse(await request.json());
    const visit = await requestVisit(user.id, user.phoneVerified, body);
    return jsonOk({ visit }, 201);
  } catch (error) {
    return handleRouteError(error);
  }
}
