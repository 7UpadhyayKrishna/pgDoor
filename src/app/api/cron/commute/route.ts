import { prisma } from "@/lib/prisma";
import { fillCommuteQuotes } from "@/modules/commute";
import { computePropertyScores } from "@/modules/livability";
import { refreshCommuteBadges } from "@/modules/owner-insights";
import { MVP_MODES } from "@/lib/commute/modes";
import { cellFor } from "@/lib/geo/h3";
import { jsonOk } from "@/lib/http";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && new URL(request.url).searchParams.get("secret") !== secret) {
    return new Response("Unauthorized", { status: 401 });
  }

  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const dests = await prisma.destination.findMany({
    orderBy: { popularity: "desc" },
    take: 50,
  });
  const properties = await prisma.property.findMany({
    where: { status: "PUBLISHED" },
    select: { id: true, latitude: true, longitude: true, minRent: true, h3Cell: true },
    take: 500,
  });
  const missingCell = properties.filter((p) => !p.h3Cell);
  if (missingCell.length) {
    await Promise.all(
      missingCell.map((p) =>
        prisma.property.update({
          where: { id: p.id },
          data: { h3Cell: cellFor(p.latitude, p.longitude) },
        }),
      ),
    );
  }

  let refreshed = 0;
  for (const dest of dests) {
    await fillCommuteQuotes(
      properties.map((p) => ({ id: p.id, lat: p.latitude, lng: p.longitude, rent: p.minRent })),
      { destLat: dest.latitude, destLng: dest.longitude, slot: "peak" },
      MVP_MODES,
      { liveRouteLimit: 250, skipLiveIfCached: false },
    );
    refreshed += 1;
  }

  for (const p of properties.slice(0, 50)) {
    await computePropertyScores(p.id, p.latitude, p.longitude).catch(() => undefined);
    await refreshCommuteBadges(p.id).catch(() => undefined);
  }

  await prisma.commuteEdge.deleteMany({ where: { computedAt: { lt: cutoff } } });
  return jsonOk({ dests: refreshed, properties: properties.length });
}
