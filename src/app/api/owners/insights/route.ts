import { handleRouteError, jsonOk } from "@/lib/http";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { demandInsights, refreshCommuteBadges } from "@/modules/owner-insights";

export async function GET() {
  try {
    const user = await requireUser();
    const owner = await prisma.ownerProfile.findUnique({ where: { userId: user.id } });
    if (!owner) return jsonOk({ insights: [] });
    const properties = await prisma.property.findMany({ where: { ownerId: owner.id } });
    await Promise.all(properties.map((p) => refreshCommuteBadges(p.id)));
    const insights = await demandInsights(owner.id);
    return jsonOk({ insights });
  } catch (error) {
    return handleRouteError(error);
  }
}
