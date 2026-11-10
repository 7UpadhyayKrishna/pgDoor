import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { handleRouteError, jsonOk } from "@/lib/http";
import { requireUser } from "@/lib/session";
import { cellFor } from "@/lib/geo/h3";

export async function GET() {
  try {
    const user = await requireUser();
    const me = await prisma.roommateProfile.findUnique({ where: { userId: user.id } });
    const matches = me?.optIn
      ? await prisma.roommateProfile.findMany({
          where: { optIn: true, userId: { not: user.id }, destH3: me.destH3 ?? undefined },
          include: { user: { select: { name: true, id: true } } },
          take: 20,
        })
      : [];
    const pending = await prisma.roommateMatch.findMany({
      where: { OR: [{ aUserId: user.id }, { bUserId: user.id }] },
    });
    return jsonOk({ profile: me, matches, pending });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const body = z
      .object({
        destLat: z.number().optional(),
        destLng: z.number().optional(),
        destLabel: z.string().optional(),
        bio: z.string().max(500).optional(),
        habits: z.record(z.string(), z.any()).optional(),
        optIn: z.boolean().default(true),
      })
      .parse(await request.json());
    const destH3 =
      body.destLat != null && body.destLng != null ? cellFor(body.destLat, body.destLng) : undefined;
    const profile = await prisma.roommateProfile.upsert({
      where: { userId: user.id },
      update: {
        destH3,
        destLabel: body.destLabel,
        bio: body.bio,
        habits: body.habits ?? {},
        optIn: body.optIn,
      },
      create: {
        userId: user.id,
        destH3,
        destLabel: body.destLabel,
        bio: body.bio,
        habits: body.habits ?? {},
        optIn: body.optIn,
      },
    });
    return jsonOk({ profile });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await requireUser();
    const { otherUserId } = z.object({ otherUserId: z.string() }).parse(await request.json());
    const [a, b] = [user.id, otherUserId].sort();
    const row = await prisma.roommateMatch.upsert({
      where: { aUserId_bUserId: { aUserId: a, bUserId: b } },
      update:
        user.id === a ? { aAccepted: true } : { bAccepted: true },
      create: {
        aUserId: a,
        bUserId: b,
        aAccepted: user.id === a,
        bAccepted: user.id === b,
      },
    });
    return jsonOk({ match: row, canChat: row.aAccepted && row.bAccepted });
  } catch (error) {
    return handleRouteError(error);
  }
}
