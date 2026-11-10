import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { handleRouteError, jsonOk } from "@/lib/http";
import { requireUser } from "@/lib/session";
import { cellFor } from "@/lib/geo/h3";

export async function GET() {
  try {
    const user = await requireUser();
    const [alerts, searches] = await Promise.all([
      prisma.alert.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 50 }),
      prisma.userSearch.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" } }),
    ]);
    return jsonOk({ alerts, searches });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const body = z
      .object({
        destLat: z.number(),
        destLng: z.number(),
        destLabel: z.string().optional(),
        maxMin: z.number().optional(),
        maxCost: z.number().optional(),
        name: z.string().optional(),
      })
      .parse(await request.json());
    const row = await prisma.userSearch.create({
      data: {
        userId: user.id,
        name: body.name ?? body.destLabel ?? "Saved search",
        destinations: [{ h3: cellFor(body.destLat, body.destLng), label: body.destLabel, weight: 1, tripsPerWeek: 5 }],
        prefs: {},
        maxMin: body.maxMin,
        maxCost: body.maxCost,
      },
    });
    return jsonOk({ search: row });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await requireUser();
    const { id } = z.object({ id: z.string() }).parse(await request.json());
    await prisma.alert.updateMany({ where: { id, userId: user.id }, data: { readAt: new Date() } });
    return jsonOk({ ok: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
