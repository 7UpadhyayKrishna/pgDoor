import type { PrismaClient } from "@prisma/client";
import { AMENITIES } from "./amenities";
import { NCR_CITIES } from "./cities-ncr";

/** Cities, areas, landmarks and amenities: the data the listing form needs. No demo PGs or users. */
export async function seedReference(prisma: PrismaClient) {
  await prisma.amenity.createMany({ data: AMENITIES, skipDuplicates: true });

  for (const city of NCR_CITIES) {
    const row = await prisma.city.upsert({
      where: { slug: city.slug },
      update: {
        name: city.name,
        state: city.state,
        latitude: city.latitude,
        longitude: city.longitude,
      },
      create: {
        name: city.name,
        slug: city.slug,
        state: city.state,
        latitude: city.latitude,
        longitude: city.longitude,
      },
    });

    for (const area of city.areas) {
      await prisma.area.upsert({
        where: { cityId_slug: { cityId: row.id, slug: area.slug } },
        update: {
          name: area.name,
          latitude: area.latitude,
          longitude: area.longitude,
        },
        create: {
          cityId: row.id,
          name: area.name,
          slug: area.slug,
          latitude: area.latitude,
          longitude: area.longitude,
        },
      });
    }

    for (const landmark of city.landmarks) {
      const area = await prisma.area.findUnique({
        where: { cityId_slug: { cityId: row.id, slug: landmark.areaSlug } },
      });
      await prisma.landmark.upsert({
        where: { cityId_slug: { cityId: row.id, slug: landmark.slug } },
        update: { name: landmark.name, type: landmark.type },
        create: {
          cityId: row.id,
          areaId: area?.id,
          name: landmark.name,
          slug: landmark.slug,
          type: landmark.type,
          latitude: landmark.latitude,
          longitude: landmark.longitude,
        },
      });
    }
  }
}
