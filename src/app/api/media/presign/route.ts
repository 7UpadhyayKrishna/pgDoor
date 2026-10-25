import { presignPhoto, presignSchema } from "@/modules/media";
import { handleRouteError, jsonOk } from "@/lib/http";
import { getCurrentUser } from "@/lib/session";
import { rateLimit } from "@/lib/rate-limit";
import { clientIp } from "@/lib/request";
import { HttpError } from "@/lib/rbac";

const ANON_UPLOADS_PER_HOUR = 30;
const OWNER_UPLOADS_PER_HOUR = 120;

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    const isOwner = user && (user.role === "OWNER" || user.role === "ADMIN");
    const limited = rateLimit(
      isOwner ? `upload:user:${user.id}` : `upload:ip:${clientIp(request)}`,
      isOwner ? OWNER_UPLOADS_PER_HOUR : ANON_UPLOADS_PER_HOUR,
      60 * 60 * 1000,
    );
    if (!limited.ok) {
      throw new HttpError(429, "Too many uploads. Please try again in a while.");
    }
    const body = presignSchema.parse(await request.json());
    const result = await presignPhoto(body, isOwner ? "properties" : "drafts");
    return jsonOk(result);
  } catch (error) {
    return handleRouteError(error);
  }
}
