import { prisma } from "@/lib/prisma";
import { handleRouteError, jsonOk } from "@/lib/http";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const citySlug = url.searchParams.get("city") ?? undefined;
    const north = url.searchParams.get("north");
    const south = url.searchParams.get("south");
    const east = url.searchParams.get("east");
    const west = url.searchParams.get("west");

    let cityId: string | undefined;
    if (citySlug) {
      const city = await prisma.city.findUnique({ where: { slug: citySlug } });
      cityId = city?.id;
    }

    const landmarks = await prisma.landmark.findMany({
      where: cityId ? { cityId } : undefined,
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        slug: true,
        type: true,
        latitude: true,
        longitude: true,
        city: { select: { slug: true, name: true } },
      },
    });

    let filtered = landmarks.filter((l) => l.longitude != null);
    if (north && south && east && west) {
      const n = Number(north);
      const s = Number(south);
      const e = Number(east);
      const w = Number(west);
      if (![n, s, e, w].some(Number.isNaN)) {
        filtered = filtered.filter(
          (l) =>
            l.latitude >= s &&
            l.latitude <= n &&
            (l.longitude as number) >= w &&
            (l.longitude as number) <= e,
        );
      }
    }

    return jsonOk({
      landmarks: filtered.map((l) => ({
        id: l.id,
        name: l.name,
        slug: l.slug,
        type: l.type,
        latitude: l.latitude,
        longitude: l.longitude as number,
        citySlug: l.city.slug,
        cityName: l.city.name,
      })),
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
