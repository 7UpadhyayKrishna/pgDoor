import { changePassword, changePasswordSchema } from "@/modules/auth";
import { handleRouteError, jsonOk } from "@/lib/http";
import { requireUser } from "@/lib/session";

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const body = changePasswordSchema.parse(await request.json());
    await changePassword(user.id, body);
    return jsonOk({ ok: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
