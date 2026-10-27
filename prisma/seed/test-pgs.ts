import { randomUUID } from "node:crypto";
import type {
  BedStatus,
  PgType,
  Prisma,
  PrismaClient,
  RoomSharingType,
  VerificationLevel,
} from "@prisma/client";
import { bedsPerSharing, slugify } from "../../src/lib/utils";
import { DEMO_PGS } from "./demo-pgs";

const TOTAL = 1000;
const NOIDA_COUNT = 550;
const BATCH_SIZE = 100;
const OWNER_COUNT = 20;

export const TEST_OWNER_PHONES = Array.from(
  { length: OWNER_COUNT },
  (_, i) => `+91700000${String(i + 1).padStart(4, "0")}`,
);

const PHOTO_POOL = [...new Set(DEMO_PGS.flatMap((pg) => pg.photos))];

const NAME_PREFIXES = [
  "Urban", "Shanti", "Comfort", "Green", "Royal", "Sunrise", "Elite", "Cosy", "Prime", "Lotus",
  "Silver Oak", "Blue Sky", "Happy", "Metro", "Campus", "Skyline", "Harmony", "Nest", "Aashiyana", "Galaxy",
];
const NAME_SUFFIXES = ["PG", "Residency", "Co-Living", "Homes", "Stay", "House", "Living", "Hostel"];
const ELECTRICITY_NOTES = ["Actual", "Included", "Included up to 150 units", "Rs 9 per unit"];
const MAINTENANCE_CHARGES = [0, 200, 300, 500, 800, 1000];
const ADDRESS_PREFIXES = ["Plot", "House", "Block", "Tower", "Villa"];
const SHARING_TYPES: RoomSharingType[] = ["SINGLE", "DOUBLE", "TRIPLE", "FOUR"];
const RENT_MULTIPLIER: Record<RoomSharingType, number> = {
  SINGLE: 1,
  DOUBLE: 0.72,
  TRIPLE: 0.6,
  FOUR: 0.52,
};

const CITY_PRICING: Record<string, { singleMin: number; singleMax: number; floor: number }> = {
  noida: { singleMin: 10000, singleMax: 18000, floor: 6500 },
  "greater-noida": { singleMin: 7500, singleMax: 12000, floor: 5000 },
};

const AREA_WEIGHTS: Record<string, number> = {
  "sector-62": 5,
  "sector-63": 4,
  "sector-18": 3,
  "sector-125": 3,
  "sector-128": 2,
  "knowledge-park-1": 4,
  "knowledge-park-2": 4,
  "knowledge-park-3": 4,
  "pari-chowk": 3,
  "greater-noida-west": 4,
};

const OPTIONAL_AMENITIES = [
  "ac", "mattress", "wardrobe", "attached-bathroom", "attached-balcony", "cctv", "lift",
  "parking", "power-backup", "washing-machine", "laundry", "housekeeping", "maintenance",
];

function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Rng = () => number;

const int = (rng: Rng, min: number, max: number) => Math.floor(rng() * (max - min + 1)) + min;
const pick = <T>(rng: Rng, items: readonly T[]) => items[Math.floor(rng() * items.length)];
const roundTo = (value: number, step: number) => Math.round(value / step) * step;

function weighted<T>(rng: Rng, items: readonly { value: T; weight: number }[]) {
  const total = items.reduce((sum, item) => sum + item.weight, 0);
  let roll = rng() * total;
  for (const item of items) {
    roll -= item.weight;
    if (roll <= 0) return item.value;
  }
  return items[items.length - 1].value;
}

const PG_TYPE_WEIGHTS: { value: PgType; weight: number }[] = [
  { value: "BOYS", weight: 35 },
  { value: "GIRLS", weight: 35 },
  { value: "CO_LIVING", weight: 20 },
  { value: "UNISEX", weight: 10 },
];

const VERIFICATION_WEIGHTS: { value: VerificationLevel; weight: number }[] = [
  { value: "PGDOOR_VERIFIED", weight: 25 },
  { value: "PROPERTY_VERIFIED", weight: 20 },
  { value: "OWNER_VERIFIED", weight: 20 },
  { value: "UNVERIFIED", weight: 35 },
];

const VERIFICATION_TYPES = [
  "PROPERTY", "OWNER", "PHOTOS", "ADDRESS", "AMENITIES", "PRICING", "AVAILABILITY",
] as const;

type AreaRow = { id: string; name: string; slug: string; latitude: number | null; longitude: number | null };
type CityRow = { id: string; name: string; slug: string; latitude: number | null; longitude: number | null; areas: AreaRow[] };

type GeneratedPg = {
  property: Prisma.PropertyCreateManyInput;
  roomTypes: Prisma.RoomTypeCreateManyInput[];
  rooms: Prisma.RoomCreateManyInput[];
  beds: Prisma.BedCreateManyInput[];
  amenitySlugs: string[];
  photos: string[];
};

function generatePg(
  index: number,
  city: CityRow,
  ownerId: string,
  rng: Rng,
): GeneratedPg {
  const area = weighted(
    rng,
    city.areas.map((a) => ({ value: a, weight: AREA_WEIGHTS[a.slug] ?? 1 })),
  );
  const name = `${pick(rng, NAME_PREFIXES)} ${pick(rng, NAME_SUFFIXES)}`;
  const slug = `${slugify(`${name} ${area.name} ${city.name}`)}-t${String(index).padStart(4, "0")}`;
  const propertyId = randomUUID();

  // ~800 m jitter so markers don't stack on the area centroid.
  const baseLat = area.latitude ?? city.latitude ?? 28.5;
  const baseLng = area.longitude ?? city.longitude ?? 77.4;
  const latitude = baseLat + (rng() - 0.5) * 0.0144;
  const longitude = baseLng + (rng() - 0.5) * 0.0164;

  const pgType = weighted(rng, PG_TYPE_WEIGHTS);
  const verificationLevel = weighted(rng, VERIFICATION_WEIGHTS);
  const foodIncluded = rng() < 0.75;
  const featured = rng() < 0.05;
  const isGirls = pgType === "GIRLS";

  const pricing = CITY_PRICING[city.slug];
  const singleRent = roundTo(int(rng, pricing.singleMin, pricing.singleMax), 500);
  const sharingTypes = [...SHARING_TYPES]
    .sort(() => rng() - 0.5)
    .slice(0, int(rng, 1, 3))
    .sort((a, b) => SHARING_TYPES.indexOf(a) - SHARING_TYPES.indexOf(b));

  const roomTypes: Prisma.RoomTypeCreateManyInput[] = [];
  const rooms: Prisma.RoomCreateManyInput[] = [];
  const beds: Prisma.BedCreateManyInput[] = [];
  let totalBeds = 0;
  let availableBeds = 0;
  let minRent = Number.POSITIVE_INFINITY;
  let minDeposit = Number.POSITIVE_INFINITY;
  let roomNumber = 0;

  for (const sharingType of sharingTypes) {
    const perRoom = bedsPerSharing(sharingType);
    const roomCount = int(rng, 2, 10);
    const typeBeds = roomCount * perRoom;
    const typeAvailable = int(rng, 0, Math.ceil(typeBeds / 2));
    const rent = Math.max(pricing.floor, roundTo(singleRent * RENT_MULTIPLIER[sharingType], 500));
    const deposit = roundTo(rent * (1 + rng() * 0.5), 500);
    const roomTypeId = randomUUID();

    roomTypes.push({
      id: roomTypeId,
      propertyId,
      sharingType,
      rent,
      deposit,
      totalBeds: typeBeds,
      availableBeds: typeAvailable,
    });

    let remaining = typeAvailable;
    for (let r = 0; r < roomCount; r += 1) {
      roomNumber += 1;
      const roomId = randomUUID();
      rooms.push({ id: roomId, propertyId, roomTypeId, name: `Room ${roomNumber}`, totalBeds: perRoom });
      for (let b = 0; b < perRoom; b += 1) {
        const status: BedStatus = remaining > 0 ? "AVAILABLE" : "OCCUPIED";
        if (status === "AVAILABLE") remaining -= 1;
        beds.push({ id: randomUUID(), roomId, label: String.fromCharCode(65 + b), status });
      }
    }

    totalBeds += typeBeds;
    availableBeds += typeAvailable;
    minRent = Math.min(minRent, rent);
    minDeposit = Math.min(minDeposit, deposit);
  }

  const amenitySlugs = ["wifi", "bed", ...OPTIONAL_AMENITIES.filter(() => rng() < 0.45)];
  if (foodIncluded) amenitySlugs.push("food");

  const photos = [...PHOTO_POOL].sort(() => rng() - 0.5).slice(0, int(rng, 1, 3));

  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;
  const publishedAt = new Date(now - int(rng, 1, 120) * day);
  const availabilityConfirmedAt = new Date(now - int(rng, 1, 14 * 24) * 60 * 60 * 1000);
  const verifiedAt = verificationLevel === "UNVERIFIED" ? null : new Date(publishedAt.getTime() + 2 * day);
  const reviewCount = int(rng, 0, 250);

  const audience = isGirls
    ? "girls"
    : pgType === "BOYS"
      ? "boys"
      : pgType === "CO_LIVING"
        ? "working professionals"
        : "students and professionals";

  return {
    property: {
      id: propertyId,
      ownerId,
      name,
      slug,
      description: `${name} is a ${pgType.toLowerCase().replace("_", "-")} PG in ${area.name}, ${city.name} for ${audience}.${
        foodIncluded ? " Home-style meals included." : " Cooking and food delivery friendly."
      } Test listing.`,
      address: `${pick(rng, ADDRESS_PREFIXES)} ${int(rng, 1, 250)}, ${area.name}, ${city.name}`,
      cityId: city.id,
      areaId: area.id,
      latitude,
      longitude,
      pgType,
      status: "PUBLISHED",
      verificationLevel,
      featured,
      minRent: Number.isFinite(minRent) ? minRent : 0,
      minDeposit: Number.isFinite(minDeposit) ? minDeposit : 0,
      totalBeds,
      availableBeds,
      foodIncluded,
      maintenanceCharge: pick(rng, MAINTENANCE_CHARGES),
      electricityNote: pick(rng, ELECTRICITY_NOTES),
      vegetarianFood: foodIncluded,
      nonVegetarianFood: foodIncluded && !isGirls && rng() < 0.5,
      smokingAllowed: !isGirls && rng() < 0.1,
      visitorsAllowed: !isGirls && rng() < 0.6,
      cookingAllowed: rng() < 0.3,
      ratingAvg: reviewCount === 0 ? 0 : Math.round((3.5 + rng() * 1.4) * 10) / 10,
      reviewCount,
      viewCount: int(rng, 0, 3000),
      availabilityUpdatedAt: availabilityConfirmedAt,
      availabilityConfirmedAt,
      publishedAt,
      verifiedAt,
    },
    roomTypes,
    rooms,
    beds,
    amenitySlugs,
    photos,
  };
}

async function upsertTestOwners(prisma: PrismaClient) {
  const ownerIds: string[] = [];
  for (let n = 1; n <= OWNER_COUNT; n += 1) {
    const label = String(n).padStart(2, "0");
    const phone = TEST_OWNER_PHONES[n - 1];
    const user = await prisma.user.upsert({
      where: { phone },
      update: { role: "OWNER", phoneVerified: true },
      create: {
        phone,
        name: `Test Owner ${label}`,
        email: `test-owner-${label}@example.com`,
        role: "OWNER",
        phoneVerified: true,
      },
    });
    const profile = await prisma.ownerProfile.upsert({
      where: { userId: user.id },
      update: { verificationStatus: "VERIFIED" },
      create: {
        userId: user.id,
        businessName: `Test Stays ${label}`,
        verificationStatus: "VERIFIED",
      },
    });
    ownerIds.push(profile.id);
  }
  return ownerIds;
}

/** Inserts 1000 deterministic test PGs across Noida and Greater Noida; skips ones already present. */
export async function seedTestPgs(prisma: PrismaClient, amenityBySlug: Record<string, string>) {
  const cities = await prisma.city.findMany({
    where: { slug: { in: ["noida", "greater-noida"] } },
    include: { areas: true },
  });
  const noida = cities.find((c) => c.slug === "noida");
  const greaterNoida = cities.find((c) => c.slug === "greater-noida");
  if (!noida || !greaterNoida) throw new Error("Noida and Greater Noida must be seeded first");

  const ownerIds = await upsertTestOwners(prisma);
  const rng = mulberry32(20261020);

  const generated: GeneratedPg[] = [];
  for (let i = 1; i <= TOTAL; i += 1) {
    const city = i <= NOIDA_COUNT ? noida : greaterNoida;
    generated.push(generatePg(i, city, ownerIds[(i - 1) % ownerIds.length], rng));
  }

  const existing = await prisma.property.findMany({
    where: { slug: { in: generated.map((g) => g.property.slug) } },
    select: { slug: true },
  });
  const existingSlugs = new Set(existing.map((p) => p.slug));
  const pending = generated.filter((g) => !existingSlugs.has(g.property.slug));

  for (let start = 0; start < pending.length; start += BATCH_SIZE) {
    const batch = pending.slice(start, start + BATCH_SIZE);
    const amenities = batch.flatMap((g) =>
      g.amenitySlugs
        .filter((s) => amenityBySlug[s])
        .map((s) => ({ propertyId: g.property.id!, amenityId: amenityBySlug[s] })),
    );
    const photos = batch.flatMap((g) =>
      g.photos.map((url, sortOrder) => ({
        propertyId: g.property.id!,
        url,
        alt: g.property.name,
        sortOrder,
      })),
    );
    const checks = batch
      .filter((g) => g.property.verificationLevel === "PGDOOR_VERIFIED")
      .flatMap((g) =>
        VERIFICATION_TYPES.map((type) => ({
          propertyId: g.property.id!,
          type,
          passed: true,
          checkedAt: g.property.verifiedAt as Date,
        })),
      );

    await prisma.$transaction([
      prisma.property.createMany({ data: batch.map((g) => g.property) }),
      prisma.roomType.createMany({ data: batch.flatMap((g) => g.roomTypes) }),
      prisma.room.createMany({ data: batch.flatMap((g) => g.rooms) }),
      prisma.bed.createMany({ data: batch.flatMap((g) => g.beds) }),
      prisma.propertyAmenity.createMany({ data: amenities, skipDuplicates: true }),
      prisma.photo.createMany({ data: photos }),
      prisma.verificationCheck.createMany({ data: checks }),
    ]);
    console.info(`  test PGs: inserted ${Math.min(start + BATCH_SIZE, pending.length)}/${pending.length}`);
  }

  return { inserted: pending.length, skipped: existingSlugs.size };
}
