import { prisma } from "@/lib/prisma";
import { MODE_LABEL } from "@/lib/commute/modes";

export async function refreshCommuteBadges(propertyId: string) {
  const property = await prisma.property.findUnique({ where: { id: propertyId } });
  if (!property) return [];
  const dests = await prisma.destination.findMany({ orderBy: { popularity: "desc" }, take: 12 });
  const edges = await prisma.commuteEdge.findMany({
    where: { propertyId, destH3: { in: dests.map((d) => d.h3Cell) } },
  });
  const badges: string[] = [];
  for (const dest of dests) {
    const edge = edges
      .filter((e) => e.destH3 === dest.h3Cell)
      .sort((a, b) => a.minutes - b.minutes)[0];
    if (!edge || edge.minutes > 25) continue;
    if (edge.minutes <= 12 && dest.type === "COLLEGE") {
      badges.push(`Walk to ${dest.name}`);
    } else {
      badges.push(`${edge.minutes} min to ${dest.name} by ${MODE_LABEL[edge.mode]}`);
    }
    if (badges.length >= 3) break;
  }
  await prisma.property.update({ where: { id: propertyId }, data: { commuteBadges: badges } });
  return badges;
}

export async function demandInsights(ownerId: string) {
  const properties = await prisma.property.findMany({ where: { ownerId }, select: { id: true, name: true, minRent: true } });
  const searches = await prisma.userSearch.count();
  return properties.map((p) => ({
    propertyId: p.id,
    name: p.name,
    rent: p.minRent,
    searchesThisWeek: searches,
    hint: "Shown as an indication, not a recommendation to raise rent.",
  }));
}
