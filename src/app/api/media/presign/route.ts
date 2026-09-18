import { presignPhoto, presignSchema } from "@/modules/media";
import { handleRouteError, jsonOk } from "@/lib/http";
import { requireOwner } from "@/lib/session";

export async function POST(request: Request) {
  try {
    await requireOwner();
    const body = presignSchema.parse(await request.json());
    const result = await presignPhoto(body);
    return jsonOk(result);
  } catch (error) {
    return handleRouteError(error);
  }
}
