import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { handleRouteError, jsonOk } from "@/lib/http";
import { getCurrentUser } from "@/lib/session";

const schema = z.object({
  propertyId: z.string(),
  reason: z.enum([
    "WRONG_PRICE",
    "NOT_AVAILABLE",
    "FAKE_PHOTOS",
    "WRONG_LOCATION",
    "OWNER_ISSUE",
    "DUPLICATE_LISTING",
    "OTHER",
  ]),
  details: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    const body = schema.parse(await request.json());
    const report = await prisma.report.create({
      data: {
        propertyId: body.propertyId,
        reason: body.reason,
        details: body.details,
        userId: user?.id,
      },
    });
    return jsonOk({ report }, 201);
  } catch (error) {
    return handleRouteError(error);
  }
}
