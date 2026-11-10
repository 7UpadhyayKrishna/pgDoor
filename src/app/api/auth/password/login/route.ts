import { loginWithPassword, passwordLoginSchema } from "@/modules/auth";
import { handleRouteError, jsonOk } from "@/lib/http";

export async function POST(request: Request) {
  try {
    const body = passwordLoginSchema.parse(await request.json());
    const user = await loginWithPassword(body);
    return jsonOk({
      id: user.id,
      role: user.role,
      name: user.name,
      phone: user.phone,
      ownerProfileId: user.ownerProfile?.id ?? null,
      mustChangePassword: user.mustChangePassword,
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
