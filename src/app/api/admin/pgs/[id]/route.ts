import { z } from "zod";
import { moderateProperty, setVerificationLevel } from "@/modules/verification";
import { handleRouteError, jsonOk } from "@/lib/http";
import { requireAdmin } from "@/lib/session";
import { VerificationLevel } from "@prisma/client";

const schema = z.object({
  action: z.enum(["APPROVE", "REJECT", "SUSPEND", "FEATURE", "UNFEATURE", "VERIFY"]),
  level: z.enum(["UNVERIFIED", "OWNER_VERIFIED", "PROPERTY_VERIFIED", "PGDOOR_VERIFIED"]).optional(),
});

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const admin = await requireAdmin();
    const { id } = await context.params;
    const body = schema.parse(await request.json());
    if (body.action === "VERIFY") {
      const property = await setVerificationLevel(
        id,
        (body.level as VerificationLevel) ?? "PGDOOR_VERIFIED",
        admin.id,
      );
      return jsonOk({ property });
    }
    const property = await moderateProperty(id, body.action, admin.id);
    return jsonOk({ property });
  } catch (error) {
    return handleRouteError(error);
  }
}
