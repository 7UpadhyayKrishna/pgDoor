import { verifyOtpAndSession, verifyOtpSchema } from "@/modules/auth";
import { handleRouteError, jsonOk } from "@/lib/http";

export async function POST(request: Request) {
  try {
    const body = verifyOtpSchema.parse(await request.json());
    const user = await verifyOtpAndSession(body);
    return jsonOk({
      id: user.id,
      role: user.role,
      name: user.name,
      phone: user.phone,
      ownerProfileId: user.ownerProfile?.id ?? null,
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
