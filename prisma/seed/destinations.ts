import type { DestinationType, PrismaClient } from "@prisma/client";
import { cellFor } from "../../src/lib/geo/h3";
import { DEFAULT_FARE_RULES } from "../../src/lib/commute/fare-rules";

type DestSeed = {
  name: string;
  slug: string;
  type: DestinationType;
  citySlug: string;
  latitude: number;
  longitude: number;
  aliases?: string[];
  popularity?: number;
  metroLine?: string;
  seo?: boolean;
};

const GURUGRAM_NAMED: DestSeed[] = [
  { name: "Cyber Hub", slug: "cyber-hub", type: "OFFICE", citySlug: "gurgaon", latitude: 28.495, longitude: 77.089, aliases: ["cyberhub", "साइबर हब"], popularity: 100, seo: true },
  { name: "Cyber City", slug: "cyber-city", type: "OFFICE", citySlug: "gurgaon", latitude: 28.4946, longitude: 77.0888, aliases: ["dlf cyber city", "साइबर सिटी"], popularity: 99, seo: true },
  { name: "Amity University Gurugram", slug: "amity-university-gurugram", type: "COLLEGE", citySlug: "gurgaon", latitude: 28.3193, longitude: 76.912, aliases: ["amity gurgaon", "एमिटी"], popularity: 95, seo: true },
  { name: "GD Goenka University", slug: "gd-goenka-university", type: "COLLEGE", citySlug: "gurgaon", latitude: 28.2806, longitude: 76.916, aliases: ["gd goenka", "जीडी गोएंका"], popularity: 90, seo: true },
  { name: "Golf Course Road", slug: "golf-course-road", type: "OFFICE", citySlug: "gurgaon", latitude: 28.4506, longitude: 77.099, aliases: ["gcr", "गोल्फ कोर्स रोड"], popularity: 92, seo: true },
  { name: "HUDA City Centre", slug: "huda-city-centre", type: "METRO", citySlug: "gurgaon", latitude: 28.4593, longitude: 77.0726, aliases: ["hcc metro", "हुडा सिटी सेंटर"], popularity: 94, metroLine: "Yellow", seo: true },
  { name: "Sector 55-56 Metro", slug: "sector-55-56-metro", type: "METRO", citySlug: "gurgaon", latitude: 28.4249, longitude: 77.105, aliases: ["55-56 metro"], popularity: 88, metroLine: "Rapid Metro", seo: true },
  { name: "MG Road", slug: "mg-road-gurugram", type: "OFFICE", citySlug: "gurgaon", latitude: 28.479, longitude: 77.0806, aliases: ["mg road gurgaon"], popularity: 85, seo: true },
  { name: "IFFCO Chowk", slug: "iffco-chowk", type: "METRO", citySlug: "gurgaon", latitude: 28.4721, longitude: 77.0716, aliases: ["iffco metro"], popularity: 86, metroLine: "Yellow", seo: true },
  { name: "Sikanderpur Metro", slug: "sikanderpur-metro", type: "METRO", citySlug: "gurgaon", latitude: 28.4813, longitude: 77.093, aliases: ["sikanderpur"], popularity: 87, metroLine: "Yellow", seo: true },
  { name: "Guru Dronacharya Metro", slug: "guru-dronacharya-metro", type: "METRO", citySlug: "gurgaon", latitude: 28.4917, longitude: 77.1028, metroLine: "Yellow", popularity: 70, seo: true },
  { name: "DLF Phase 3 Rapid Metro", slug: "dlf-phase-3-rapid-metro", type: "METRO", citySlug: "gurgaon", latitude: 28.4908, longitude: 77.0882, metroLine: "Rapid Metro", popularity: 80, seo: true },
  { name: "Belvedere Towers Rapid Metro", slug: "belvedere-towers-rapid-metro", type: "METRO", citySlug: "gurgaon", latitude: 28.4935, longitude: 77.086, metroLine: "Rapid Metro", popularity: 72, seo: true },
  { name: "Moulsari Avenue Rapid Metro", slug: "moulsari-avenue-rapid-metro", type: "METRO", citySlug: "gurgaon", latitude: 28.4978, longitude: 77.0835, metroLine: "Rapid Metro", popularity: 68, seo: true },
  { name: "Sector 42-43 Rapid Metro", slug: "sector-42-43-rapid-metro", type: "METRO", citySlug: "gurgaon", latitude: 28.442, longitude: 77.096, metroLine: "Rapid Metro", popularity: 74, seo: true },
  { name: "Sector 53-54 Rapid Metro", slug: "sector-53-54-rapid-metro", type: "METRO", citySlug: "gurgaon", latitude: 28.434, longitude: 77.101, metroLine: "Rapid Metro", popularity: 73, seo: true },
  { name: "The NorthCap University", slug: "northcap-university", type: "COLLEGE", citySlug: "gurgaon", latitude: 28.4235, longitude: 77.055, aliases: ["itmu", "ncu"], popularity: 78, seo: true },
  { name: "Sushant University", slug: "sushant-university", type: "COLLEGE", citySlug: "gurgaon", latitude: 28.422, longitude: 77.066, popularity: 70, seo: true },
  { name: "Dronacharya College of Engineering", slug: "dronacharya-college", type: "COLLEGE", citySlug: "gurgaon", latitude: 28.355, longitude: 76.94, popularity: 65, seo: true },
  { name: "BML Munjal University", slug: "bml-munjal-university", type: "COLLEGE", citySlug: "gurgaon", latitude: 28.247, longitude: 76.813, aliases: ["bmu"], popularity: 75, seo: true },
  { name: "KIIT College of Engineering", slug: "kiit-gurgaon", type: "COLLEGE", citySlug: "gurgaon", latitude: 28.408, longitude: 77.048, popularity: 60, seo: true },
  { name: "Udyog Vihar", slug: "udyog-vihar", type: "OFFICE", citySlug: "gurgaon", latitude: 28.508, longitude: 77.085, popularity: 82, seo: true },
  { name: "Unitech Cyber Park", slug: "unitech-cyber-park", type: "OFFICE", citySlug: "gurgaon", latitude: 28.412, longitude: 77.042, popularity: 77, seo: true },
  { name: "Spaze iTech Park", slug: "spaze-itech-park", type: "OFFICE", citySlug: "gurgaon", latitude: 28.411, longitude: 77.043, popularity: 76, seo: true },
  { name: "Candor TechSpace", slug: "candor-techspace", type: "OFFICE", citySlug: "gurgaon", latitude: 28.41, longitude: 77.05, popularity: 74, seo: true },
  { name: "WeWork Platina Tower", slug: "wework-platina", type: "OFFICE", citySlug: "gurgaon", latitude: 28.496, longitude: 77.091, popularity: 71, seo: true },
  { name: "Sohna Road", slug: "sohna-road", type: "OFFICE", citySlug: "gurgaon", latitude: 28.4089, longitude: 77.0474, popularity: 80, seo: true },
  { name: "Golf Course Extension Road", slug: "golf-course-extension", type: "OFFICE", citySlug: "gurgaon", latitude: 28.412, longitude: 77.105, popularity: 79, seo: true },
  { name: "Medanta", slug: "medanta", type: "CUSTOM", citySlug: "gurgaon", latitude: 28.4394, longitude: 77.0406, aliases: ["medanta hospital"], popularity: 70, seo: true },
  { name: "Fortis Memorial Gurugram", slug: "fortis-gurugram", type: "CUSTOM", citySlug: "gurgaon", latitude: 28.457, longitude: 77.071, popularity: 62, seo: true },
  { name: "Ambience Mall", slug: "ambience-mall", type: "CUSTOM", citySlug: "gurgaon", latitude: 28.503, longitude: 77.097, popularity: 66, seo: true },
  { name: "MGF Metropolitan Mall", slug: "mgf-metropolitan", type: "CUSTOM", citySlug: "gurgaon", latitude: 28.4795, longitude: 77.0808, popularity: 61, seo: true },
  { name: "FIITJEE Gurugram", slug: "fiitjee-gurugram", type: "COACHING", citySlug: "gurgaon", latitude: 28.46, longitude: 77.078, popularity: 73, seo: true },
  { name: "Allen Career Institute Gurugram", slug: "allen-gurugram", type: "COACHING", citySlug: "gurgaon", latitude: 28.457, longitude: 77.08, popularity: 74, seo: true },
  { name: "Aakash Institute Gurugram", slug: "aakash-gurugram", type: "COACHING", citySlug: "gurgaon", latitude: 28.458, longitude: 77.075, popularity: 72, seo: true },
  { name: "Resonance Gurugram", slug: "resonance-gurugram", type: "COACHING", citySlug: "gurgaon", latitude: 28.461, longitude: 77.077, popularity: 64, seo: true },
  { name: "Career Launcher Gurugram", slug: "career-launcher-gurugram", type: "COACHING", citySlug: "gurgaon", latitude: 28.47, longitude: 77.082, popularity: 63, seo: true },
  { name: "IMS Gurugram", slug: "ims-gurugram", type: "COACHING", citySlug: "gurgaon", latitude: 28.468, longitude: 77.081, popularity: 60, seo: true },
  { name: "TIME Gurugram", slug: "time-gurugram", type: "COACHING", citySlug: "gurgaon", latitude: 28.469, longitude: 77.079, popularity: 59, seo: true },
  { name: "American Library Gurugram", slug: "american-library-gurugram", type: "LIBRARY", citySlug: "gurgaon", latitude: 28.47, longitude: 77.07, popularity: 55, seo: true },
  { name: "DLF Phase 1", slug: "dlf-phase-1", type: "OFFICE", citySlug: "gurgaon", latitude: 28.474, longitude: 77.101, popularity: 67, seo: true },
  { name: "DLF Phase 2", slug: "dlf-phase-2", type: "OFFICE", citySlug: "gurgaon", latitude: 28.486, longitude: 77.086, popularity: 69, seo: true },
  { name: "DLF Phase 4", slug: "dlf-phase-4", type: "OFFICE", citySlug: "gurgaon", latitude: 28.466, longitude: 77.093, popularity: 66, seo: true },
  { name: "DLF Phase 5", slug: "dlf-phase-5", type: "OFFICE", citySlug: "gurgaon", latitude: 28.448, longitude: 77.105, popularity: 68, seo: true },
  { name: "Worldmark Gurugram", slug: "worldmark-gurugram", type: "OFFICE", citySlug: "gurgaon", latitude: 28.508, longitude: 77.072, popularity: 64, seo: true },
  { name: "Two Horizon Centre", slug: "two-horizon-centre", type: "OFFICE", citySlug: "gurgaon", latitude: 28.448, longitude: 77.096, popularity: 63, seo: true },
  { name: "AIHP Palms", slug: "aihp-palms", type: "OFFICE", citySlug: "gurgaon", latitude: 28.41, longitude: 77.048, popularity: 58, seo: true },
  { name: "Vatika Business Park", slug: "vatika-business-park", type: "OFFICE", citySlug: "gurgaon", latitude: 28.412, longitude: 77.07, popularity: 62, seo: true },
  { name: "ILBS / Medanta Medicity cluster", slug: "medicity-cluster", type: "CUSTOM", citySlug: "gurgaon", latitude: 28.44, longitude: 77.041, popularity: 57, seo: true },
];

const NOIDA_NAMED: DestSeed[] = [
  { name: "Noida Sector 62 IT Hub", slug: "noida-sector-62", type: "OFFICE", citySlug: "noida", latitude: 28.628, longitude: 77.3649, aliases: ["sec 62", "नoida 62"], popularity: 95, seo: true },
  { name: "Noida Sector 18", slug: "noida-sector-18", type: "METRO", citySlug: "noida", latitude: 28.5703, longitude: 77.3219, metroLine: "Blue", popularity: 88, seo: true },
  { name: "Botanical Garden Metro", slug: "botanical-garden", type: "METRO", citySlug: "noida", latitude: 28.564, longitude: 77.3344, metroLine: "Blue", popularity: 84, seo: true },
  { name: "Film City Noida", slug: "film-city-noida", type: "OFFICE", citySlug: "noida", latitude: 28.57, longitude: 77.353, popularity: 70, seo: true },
  { name: "Advant Navis Business Park", slug: "advant-navis", type: "OFFICE", citySlug: "noida", latitude: 28.627, longitude: 77.373, popularity: 72, seo: true },
  { name: "Jaypee Institute of Information Technology", slug: "jiit-noida", type: "COLLEGE", citySlug: "noida", latitude: 28.629, longitude: 77.372, popularity: 80, seo: true },
  { name: "Amity University Noida", slug: "amity-university-noida", type: "COLLEGE", citySlug: "noida", latitude: 28.544, longitude: 77.333, popularity: 90, seo: true },
];

const DELHI_NAMED: DestSeed[] = [
  { name: "Connaught Place", slug: "connaught-place", type: "OFFICE", citySlug: "delhi", latitude: 28.6315, longitude: 77.2167, aliases: ["cp", "कनॉट प्लेस"], popularity: 90, seo: true },
  { name: "Nehru Place", slug: "nehru-place", type: "OFFICE", citySlug: "delhi", latitude: 28.5494, longitude: 77.2501, popularity: 82, seo: true },
  { name: "AIIMS Delhi", slug: "aiims-delhi", type: "CUSTOM", citySlug: "delhi", latitude: 28.5672, longitude: 77.21, popularity: 85, seo: true },
  { name: "Karol Bagh", slug: "karol-bagh", type: "CUSTOM", citySlug: "delhi", latitude: 28.6527, longitude: 77.1902, popularity: 70, seo: true },
  { name: "Hauz Khas", slug: "hauz-khas", type: "OFFICE", citySlug: "delhi", latitude: 28.5494, longitude: 77.2001, popularity: 75, seo: true },
  { name: "Saket", slug: "saket-delhi", type: "OFFICE", citySlug: "delhi", latitude: 28.5245, longitude: 77.2066, popularity: 74, seo: true },
];

const GREATER_NOIDA_NAMED: DestSeed[] = [
  { name: "Bennett University", slug: "bennett-university", type: "COLLEGE", citySlug: "greater-noida", latitude: 28.4503, longitude: 77.5844, popularity: 88, seo: true },
  { name: "Sharda University", slug: "sharda-university", type: "COLLEGE", citySlug: "greater-noida", latitude: 28.4733, longitude: 77.4826, popularity: 87, seo: true },
  { name: "Galgotias University", slug: "galgotias-university", type: "COLLEGE", citySlug: "greater-noida", latitude: 28.3669, longitude: 77.5408, popularity: 86, seo: true },
  { name: "Knowledge Park II Metro", slug: "knowledge-park-2-metro", type: "METRO", citySlug: "greater-noida", latitude: 28.457, longitude: 77.501, metroLine: "Aqua", popularity: 70, seo: true },
  { name: "Pari Chowk", slug: "pari-chowk", type: "CUSTOM", citySlug: "greater-noida", latitude: 28.4655, longitude: 77.51, popularity: 72, seo: true },
];

function gurugramSectors(): DestSeed[] {
  return Array.from({ length: 115 }, (_, i) => {
    const n = i + 1;
    const row = Math.floor(i / 12);
    const col = i % 12;
    return {
      name: `Sector ${n} Gurugram`,
      slug: `sector-${n}-gurugram`,
      type: "CUSTOM" as const,
      citySlug: "gurgaon",
      latitude: 28.36 + row * 0.012 + col * 0.001,
      longitude: 76.98 + col * 0.012 + row * 0.001,
      aliases: [`sec ${n}`, `sector ${n} gurgaon`, `सेक्टर ${n}`],
      popularity: n <= 57 ? 45 : 15,
      seo: n <= 10,
    };
  });
}

function udyogPhases(): DestSeed[] {
  return Array.from({ length: 5 }, (_, i) => ({
    name: `Udyog Vihar Phase ${i + 1}`,
    slug: `udyog-vihar-phase-${i + 1}`,
    type: "OFFICE" as const,
    citySlug: "gurgaon",
    latitude: 28.5 + i * 0.004,
    longitude: 77.08 + i * 0.003,
    popularity: 50,
    seo: false,
  }));
}

function coachingExtras(): DestSeed[] {
  const names = [
    "Unacademy Gurugram",
    "Physics Wallah Gurugram",
    "Vedantu Gurugram",
    "Byju's Gurugram",
    "Supergrad Gurugram",
    "CLAT Possible Gurugram",
    "LegalEdge Gurugram",
    "Bankers Adda Gurugram",
  ];
  return names.map((name, i) => ({
    name,
    slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    type: "COACHING" as const,
    citySlug: "gurgaon",
    latitude: 28.45 + i * 0.004,
    longitude: 77.06 + i * 0.003,
    popularity: 40,
  }));
}

function extraGurugramClusters(): DestSeed[] {
  const labels = [
    "Office",
    "Coaching hub",
    "Library",
    "Hospital",
    "Market",
    "Tech park",
    "Campus",
    "Metro feeder",
  ];
  return Array.from({ length: 128 }, (_, i) => {
    const kind = labels[i % labels.length];
    const type: DestinationType =
      kind === "Campus"
        ? "COLLEGE"
        : kind === "Coaching hub"
          ? "COACHING"
          : kind === "Library"
            ? "LIBRARY"
            : kind === "Metro feeder"
              ? "METRO"
              : kind === "Office" || kind === "Tech park"
                ? "OFFICE"
                : "CUSTOM";
    return {
      name: `Gurugram ${kind} ${Math.floor(i / labels.length) + 1}`,
      slug: `gurugram-${kind.toLowerCase().replace(/\s+/g, "-")}-${Math.floor(i / labels.length) + 1}`,
      type,
      citySlug: "gurgaon",
      latitude: 28.38 + (i % 16) * 0.01,
      longitude: 76.99 + Math.floor(i / 16) * 0.01,
      aliases: [`gurgaon ${kind.toLowerCase()} ${Math.floor(i / labels.length) + 1}`],
      popularity: 12,
    };
  });
}

export const ALL_DESTINATIONS: DestSeed[] = [
  ...GURUGRAM_NAMED,
  ...gurugramSectors(),
  ...udyogPhases(),
  ...coachingExtras(),
  ...extraGurugramClusters(),
  ...NOIDA_NAMED,
  ...DELHI_NAMED,
  ...GREATER_NOIDA_NAMED,
];

export async function seedDestinations(prisma: PrismaClient) {
  const cities = await prisma.city.findMany();
  const cityBySlug = new Map(cities.map((c) => [c.slug, c.id]));
  const rows = ALL_DESTINATIONS.map((dest) => ({
    name: dest.name,
    slug: dest.slug,
    type: dest.type,
    latitude: dest.latitude,
    longitude: dest.longitude,
    h3Cell: cellFor(dest.latitude, dest.longitude),
    aliases: dest.aliases ?? [],
    popularity: dest.popularity ?? 0,
    metroLine: dest.metroLine,
    seoEnabled: Boolean(dest.seo),
    cityId: cityBySlug.get(dest.citySlug) ?? null,
  }));
  await prisma.destination.createMany({ data: rows, skipDuplicates: true });

  await prisma.fareRule.deleteMany({ where: { city: "gurugram" } });
  await prisma.fareRule.createMany({
    data: DEFAULT_FARE_RULES.map((rule) => ({
      mode: rule.mode,
      city: rule.city,
      effectiveFrom: new Date(rule.effectiveFrom),
      slabs: rule.slabs ?? undefined,
      base: rule.base,
      perKm: rule.perKm,
      perMin: rule.perMin,
      peakMultiplier: rule.peakMultiplier ?? 1,
      sourceUrl: rule.sourceUrl,
      estimate: Boolean(rule.estimate),
    })),
  });
}
