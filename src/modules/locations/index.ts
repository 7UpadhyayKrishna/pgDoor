import { prisma } from "@/lib/prisma";

export async function listCities() {
  return prisma.city.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    include: {
      areas: { orderBy: { name: "asc" } },
    },
  });
}

export async function getCityBySlug(slug: string) {
  return prisma.city.findUnique({
    where: { slug },
    include: { areas: { orderBy: { name: "asc" } } },
  });
}

export async function getAreaBySlugs(citySlug: string, areaSlug: string) {
  const city = await prisma.city.findUnique({ where: { slug: citySlug } });
  if (!city) return null;
  const area = await prisma.area.findUnique({
    where: { cityId_slug: { cityId: city.id, slug: areaSlug } },
    include: { city: true },
  });
  return area;
}

export async function listLandmarks(cityId?: string) {
  return prisma.landmark.findMany({
    where: cityId ? { cityId } : undefined,
    orderBy: { name: "asc" },
  });
}
