import { z } from "zod";
import {
  PgType,
  Prisma,
  PropertyStatus,
  RoomSharingType,
  VerificationLevel,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";
import { generateFromCounts, type RoomSpec } from "@/modules/inventory";
import { HttpError } from "@/lib/rbac";
import { SEARCH_PAGE_SIZE } from "@/lib/constants";

export const searchFiltersSchema = z.object({
  city: z.string().optional(),
  area: z.string().optional(),
  budgetMax: z.coerce.number().optional(),
  budgetMin: z.coerce.number().optional(),
  sharing: z.enum(["SINGLE", "DOUBLE", "TRIPLE", "FOUR"]).optional(),
  pgType: z.enum(["BOYS", "GIRLS", "CO_LIVING", "UNISEX"]).optional(),
  amenities: z.array(z.string()).optional(),
  food: z.enum(["true", "false"]).optional(),
  vegetarianFood: z.enum(["true", "false"]).optional(),
  smokingAllowed: z.enum(["true", "false"]).optional(),
  visitorsAllowed: z.enum(["true", "false"]).optional(),
  cookingAllowed: z.enum(["true", "false"]).optional(),
  availability: z.enum(["now", "week", "date"]).optional(),
  availableFrom: z.string().optional(),
  sort: z.enum(["relevance", "rent", "rent_desc", "rating", "newest", "freshness"]).optional(),
  page: z.coerce.number().int().min(1).optional(),
  featured: z.enum(["true", "false"]).optional(),
  near: z.string().optional(),
});

export type SearchFilters = z.infer<typeof searchFiltersSchema>;

const publicInclude = {
  city: true,
  area: true,
  photos: { orderBy: { sortOrder: "asc" as const }, take: 4 },
  amenities: { include: { amenity: true } },
  roomTypes: { orderBy: { rent: "asc" as const } },
} satisfies Prisma.PropertyInclude;

export function toPublicCard(property: {
  id: string;
  slug: string;
  name: string;
  pgType: PgType;
  address: string;
  city: { name: string; slug: string };
  area: { name: string; slug: string };
  latitude: number;
  longitude: number;
  minRent: number;
  minDeposit: number;
  availableBeds: number;
  totalBeds: number;
  foodIncluded: boolean;
  verificationLevel: VerificationLevel;
  featured: boolean;
  ratingAvg: number;
  reviewCount: number;
  availabilityUpdatedAt: Date;
  availabilityConfirmedAt: Date;
  moveInFrom: Date | null;
  photos: { url: string; alt: string | null }[];
  amenities: { amenity: { name: string; slug: string; group: string } }[];
  roomTypes: {
    sharingType: RoomSharingType;
    rent: number;
    deposit: number;
    availableBeds: number;
    totalBeds: number;
  }[];
}) {
  return {
    id: property.id,
    slug: property.slug,
    name: property.name,
    pgType: property.pgType,
    address: property.address,
    city: { name: property.city.name, slug: property.city.slug },
    area: { name: property.area.name, slug: property.area.slug },
    latitude: property.latitude,
    longitude: property.longitude,
    minRent: property.minRent,
    minDeposit: property.minDeposit,
    availableBeds: property.availableBeds,
    totalBeds: property.totalBeds,
    foodIncluded: property.foodIncluded,
    verificationLevel: property.verificationLevel,
    featured: property.featured,
    ratingAvg: property.ratingAvg,
    reviewCount: property.reviewCount,
    availabilityUpdatedAt: property.availabilityUpdatedAt,
    availabilityConfirmedAt: property.availabilityConfirmedAt,
    moveInFrom: property.moveInFrom,
    photos: property.photos.map((photo) => ({
      url: photo.url,
      alt: photo.alt ?? property.name,
    })),
    amenities: property.amenities.map((row) => ({
      name: row.amenity.name,
      slug: row.amenity.slug,
      group: row.amenity.group,
    })),
    roomTypes: property.roomTypes.map((rt) => ({
      sharingType: rt.sharingType,
      rent: rt.rent,
      deposit: rt.deposit,
      availableBeds: rt.availableBeds,
      totalBeds: rt.totalBeds,
    })),
  };
}

export async function searchProperties(filters: SearchFilters) {
  const page = filters.page ?? 1;
  const where: Prisma.PropertyWhereInput = {
    status: PropertyStatus.PUBLISHED,
  };

  if (filters.city) {
    where.city = { slug: filters.city };
  }
  if (filters.area) {
    where.area = { slug: filters.area };
  }
  if (filters.budgetMax) {
    where.minRent = { ...(where.minRent as object), lte: filters.budgetMax };
  }
  if (filters.budgetMin) {
    where.minRent = { ...(where.minRent as object), gte: filters.budgetMin };
  }
  if (filters.pgType) {
    where.pgType = filters.pgType as PgType;
  }
  if (filters.sharing) {
    where.roomTypes = {
      some: {
        sharingType: filters.sharing as RoomSharingType,
        availableBeds: { gt: 0 },
      },
    };
  }
  if (filters.amenities?.length) {
    where.AND = (where.AND as Prisma.PropertyWhereInput[] | undefined) ?? [];
    (where.AND as Prisma.PropertyWhereInput[]).push(
      ...filters.amenities.map((slug) => ({
        amenities: { some: { amenity: { slug } } },
      })),
    );
  }
  if (filters.food === "true") where.foodIncluded = true;
  if (filters.vegetarianFood === "true") where.vegetarianFood = true;
  if (filters.smokingAllowed === "true") where.smokingAllowed = true;
  if (filters.visitorsAllowed === "true") where.visitorsAllowed = true;
  if (filters.cookingAllowed === "true") where.cookingAllowed = true;

  if (filters.availability === "now") {
    where.availableBeds = { gt: 0 };
    where.OR = [{ moveInFrom: null }, { moveInFrom: { lte: new Date() } }];
  }
  if (filters.availability === "week") {
    const week = new Date();
    week.setDate(week.getDate() + 7);
    where.availableBeds = { gt: 0 };
    where.OR = [{ moveInFrom: null }, { moveInFrom: { lte: week } }];
  }
  if (filters.availableFrom) {
    const date = new Date(filters.availableFrom);
    if (!Number.isNaN(date.getTime())) {
      where.availableBeds = { gt: 0 };
      where.OR = [{ moveInFrom: null }, { moveInFrom: { lte: date } }];
    }
  }

  let orderBy: Prisma.PropertyOrderByWithRelationInput[] = [
    { featured: "desc" },
    { verificationLevel: "desc" },
    { availabilityConfirmedAt: "desc" },
    { ratingAvg: "desc" },
  ];
  if (filters.sort === "rent") orderBy = [{ minRent: "asc" }];
  if (filters.sort === "rent_desc") orderBy = [{ minRent: "desc" }];
  if (filters.sort === "rating") orderBy = [{ ratingAvg: "desc" }];
  if (filters.sort === "newest") orderBy = [{ publishedAt: "desc" }];
  if (filters.sort === "freshness") orderBy = [{ availabilityConfirmedAt: "desc" }];

  const [total, rows] = await Promise.all([
    prisma.property.count({ where }),
    prisma.property.findMany({
      where,
      include: publicInclude,
      orderBy,
      skip: (page - 1) * SEARCH_PAGE_SIZE,
      take: SEARCH_PAGE_SIZE,
    }),
  ]);

  return {
    total,
    page,
    pageSize: SEARCH_PAGE_SIZE,
    results: rows.map(toPublicCard),
  };
}

export async function getPublishedBySlug(slug: string) {
  const property = await prisma.property.findUnique({
    where: { slug },
    include: {
      ...publicInclude,
      photos: { orderBy: { sortOrder: "asc" } },
      reviews: {
        include: { scores: true, user: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
        take: 10,
      },
      verificationChecks: true,
    },
  });
  if (!property || property.status !== "PUBLISHED") return null;
  return property;
}

export async function getFeatured(limit = 8) {
  const rows = await prisma.property.findMany({
    where: { status: "PUBLISHED" },
    include: publicInclude,
    orderBy: [{ featured: "desc" }, { ratingAvg: "desc" }],
    take: limit,
  });
  return rows.map(toPublicCard);
}

export async function uniqueSlug(name: string, areaName: string, cityName: string) {
  const base = slugify(`${name} ${areaName} ${cityName}`);
  let slug = base;
  let i = 2;
  while (await prisma.property.findUnique({ where: { slug } })) {
    slug = `${base}-${i}`;
    i += 1;
  }
  return slug;
}

export const createPropertySchema = z.object({
  name: z.string().min(3),
  description: z.string().optional(),
  address: z.string().min(5),
  cityId: z.string(),
  areaId: z.string(),
  latitude: z.number(),
  longitude: z.number(),
  pgType: z.enum(["BOYS", "GIRLS", "CO_LIVING", "UNISEX"]),
  foodIncluded: z.boolean().optional(),
  maintenanceCharge: z.number().optional(),
  electricityNote: z.string().optional(),
  vegetarianFood: z.boolean().optional(),
  nonVegetarianFood: z.boolean().optional(),
  smokingAllowed: z.boolean().optional(),
  visitorsAllowed: z.boolean().optional(),
  cookingAllowed: z.boolean().optional(),
  amenitySlugs: z.array(z.string()).default([]),
  rooms: z
    .array(
      z.object({
        sharingType: z.enum(["SINGLE", "DOUBLE", "TRIPLE", "FOUR"]),
        rent: z.number().int().positive(),
        deposit: z.number().int().nonnegative(),
        roomCount: z.number().int().positive(),
        availableBeds: z.number().int().nonnegative(),
      }),
    )
    .min(1),
  photoUrls: z.array(z.string().url()).default([]),
});

export async function createListing(
  ownerProfileId: string,
  input: z.infer<typeof createPropertySchema>,
) {
  const [city, area] = await Promise.all([
    prisma.city.findUnique({ where: { id: input.cityId } }),
    prisma.area.findUnique({ where: { id: input.areaId } }),
  ]);
  if (!city || !area || area.cityId !== city.id) {
    throw new HttpError(400, "Pick a valid city and area");
  }

  const slug = await uniqueSlug(input.name, area.name, city.name);
  const amenities = input.amenitySlugs.length
    ? await prisma.amenity.findMany({ where: { slug: { in: input.amenitySlugs } } })
    : [];

  const property = await prisma.$transaction(async (tx) => {
    const created = await tx.property.create({
      data: {
        ownerId: ownerProfileId,
        name: input.name,
        slug,
        description: input.description,
        address: input.address,
        cityId: city.id,
        areaId: area.id,
        latitude: input.latitude,
        longitude: input.longitude,
        pgType: input.pgType,
        status: "PENDING_REVIEW",
        foodIncluded: input.foodIncluded ?? false,
        maintenanceCharge: input.maintenanceCharge,
        electricityNote: input.electricityNote,
        vegetarianFood: input.vegetarianFood ?? false,
        nonVegetarianFood: input.nonVegetarianFood ?? false,
        smokingAllowed: input.smokingAllowed ?? false,
        visitorsAllowed: input.visitorsAllowed ?? false,
        cookingAllowed: input.cookingAllowed ?? false,
        amenities: {
          create: amenities.map((amenity) => ({ amenityId: amenity.id })),
        },
        photos: {
          create: input.photoUrls.map((url, index) => ({
            url,
            sortOrder: index,
            alt: input.name,
          })),
        },
      },
    });

    await generateFromCounts(created.id, input.rooms as RoomSpec[], tx);
    return created;
  });

  return prisma.property.findUniqueOrThrow({
    where: { id: property.id },
    include: publicInclude,
  });
}

export async function listOwnerProperties(ownerProfileId: string) {
  return prisma.property.findMany({
    where: { ownerId: ownerProfileId },
    include: publicInclude,
    orderBy: { updatedAt: "desc" },
  });
}

export async function incrementView(slug: string) {
  await prisma.property.updateMany({
    where: { slug, status: "PUBLISHED" },
    data: { viewCount: { increment: 1 } },
  });
}

export { VerificationLevel };
