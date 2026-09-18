import { z } from "zod";
import { recordClick } from "@/modules/leads";
import { handleRouteError, jsonOk } from "@/lib/http";
import { getCurrentUser } from "@/lib/session";

const schema = z.object({
  propertyId: z.string(),
  leadId: z.string().optional(),
  type: z.enum(["WHATSAPP_CLICK", "CALL_CLICK", "VISIT_REQUEST"]),
});

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    const body = schema.parse(await request.json());
    const result = await recordClick({
      ...body,
      userId: user?.id,
    });
    return jsonOk(result);
  } catch (error) {
    return handleRouteError(error);
  }
}
