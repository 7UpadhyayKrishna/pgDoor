import { z } from "zod";
import { checkInputSchema, setCheck } from "@/modules/verification";
import { handleRouteError, jsonOk } from "@/lib/http";
import { requireAdmin } from "@/lib/session";

const schema = checkInputSchema.extend({
  type: z.enum(["PROPERTY", "OWNER", "PHOTOS", "ADDRESS", "AMENITIES", "PRICING", "AVAILABILITY"]),
});

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const admin = await requireAdmin();
    const { id } = await context.params;
    const { type, ...input } = schema.parse(await request.json());
    const result = await setCheck(id, type, input, admin.id);
    return jsonOk(result);
  } catch (error) {
    return handleRouteError(error);
  }
}
