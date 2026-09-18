import { requestOtp, sendOtpSchema } from "@/modules/auth";
import { handleRouteError, jsonOk } from "@/lib/http";

export async function POST(request: Request) {
  try {
    const body = sendOtpSchema.parse(await request.json());
    const result = await requestOtp(body);
    return jsonOk(result);
  } catch (error) {
    return handleRouteError(error);
  }
}
