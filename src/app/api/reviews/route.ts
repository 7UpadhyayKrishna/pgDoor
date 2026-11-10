import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { handleRouteError, jsonOk } from "@/lib/http";
import { requireUser } from "@/lib/session";

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const body = z
      .object({
        propertyId: z.string(),
        overall: z.number().min(1).max(5),
        comment: z.string().max(2000).optional(),
        cleanliness: z.number().min(1).max(5),
        food: z.number().min(1).max(5),
        location: z.number().min(1).max(5),
        management: z.number().min(1).max(5),
        value: z.number().min(1).max(5),
        commute: z.number().min(1).max(5).optional(),
        safety: z.number().min(1).max(5).optional(),
        owner: z.number().min(1).max(5).optional(),
      })
      .parse(await request.json());

    const stay = await prisma.visit.findFirst({
      where: {
        status: "COMPLETED",
        lead: { seekerId: user.id, propertyId: body.propertyId },
      },
    });

    const review = await prisma.review.upsert({
      where: { userId_propertyId: { userId: user.id, propertyId: body.propertyId } },
      update: {
        overall: body.overall,
        comment: body.comment,
        verifiedStay: Boolean(stay),
      },
      create: {
        userId: user.id,
        propertyId: body.propertyId,
        overall: body.overall,
        comment: body.comment,
        verifiedStay: Boolean(stay),
        scores: {
          create: {
            cleanliness: body.cleanliness,
            food: body.food,
            location: body.location,
            management: body.management,
            value: body.value,
            commute: body.commute ?? 0,
            safety: body.safety ?? 0,
            owner: body.owner ?? 0,
          },
        },
      },
    });

    const agg = await prisma.review.aggregate({
      where: { propertyId: body.propertyId },
      _avg: { overall: true },
      _count: true,
    });
    await prisma.property.update({
      where: { id: body.propertyId },
      data: { ratingAvg: agg._avg.overall ?? 0, reviewCount: agg._count },
    });

    return jsonOk({ review, verifiedStay: Boolean(stay) });
  } catch (error) {
    return handleRouteError(error);
  }
}
