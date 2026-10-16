import { z } from "zod";
import { handleRouteError, jsonOk } from "@/lib/http";
import { requireUser } from "@/lib/session";
import { listLeadMessages, sendLeadMessage } from "@/modules/leads";

const postSchema = z.object({
  body: z.string().trim().min(1).max(2000),
});

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ leadId: string }> },
) {
  try {
    const user = await requireUser();
    const { leadId } = await params;
    const messages = await listLeadMessages(leadId, user.id, user.ownerProfileId);
    return jsonOk({ messages, currentUserId: user.id });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ leadId: string }> },
) {
  try {
    const user = await requireUser();
    const { leadId } = await params;
    const { body } = postSchema.parse(await request.json());
    const message = await sendLeadMessage(leadId, user.id, body, user.ownerProfileId);
    return jsonOk({ message }, 201);
  } catch (error) {
    return handleRouteError(error);
  }
}
