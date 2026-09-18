import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { handleRouteError, jsonOk } from "@/lib/http";
import { requireUser } from "@/lib/session";
import { track, AnalyticsEvent } from "@/modules/analytics";

export async function GET() {
  try {
    const user = await requireUser();
    const saved = await prisma.savedProperty.findMany({
      where: { userId: user.id },
      include: {
        property: {
          include: {
            city: true,
            area: true,
            photos: { take: 1, orderBy: { sortOrder: "asc" } },
            amenities: { include: { amenity: true } },
            roomTypes: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    return jsonOk({ saved });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const { propertyId } = z.object({ propertyId: z.string() }).parse(await request.json());
    const row = await prisma.savedProperty.upsert({
      where: { userId_propertyId: { userId: user.id, propertyId } },
      update: {},
      create: { userId: user.id, propertyId },
    });
    await track(AnalyticsEvent.save, { propertyId });
    return jsonOk({ saved: row });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await requireUser();
    const { propertyId } = z.object({ propertyId: z.string() }).parse(await request.json());
    await prisma.savedProperty.delete({
      where: { userId_propertyId: { userId: user.id, propertyId } },
    });
    return jsonOk({ ok: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
