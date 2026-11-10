import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { isPrelaunch } from "@/lib/launch";
import { siteUrl } from "@/lib/site";

export const dynamic = "force-dynamic";

const STATIC_PAGES = ["/", "/owners", "/owners/register", "/about", "/help", "/contact", "/privacy", "/terms", "/refund-policy"];
const SEEKER_STATIC_PAGES = ["/pgs", "/compare"];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const now = new Date();
  const entries: MetadataRoute.Sitemap = STATIC_PAGES.map((path) => ({
    url: `${base}${path}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: path === "/" ? 1 : 0.5,
  }));

  // Seeker pages redirect to "/" before launch, so they don't belong in the sitemap yet.
  if (isPrelaunch()) return entries;

  const properties = await prisma.property.findMany({
    where: { status: "PUBLISHED" },
    select: {
      slug: true,
      updatedAt: true,
      city: { select: { slug: true } },
      area: { select: { slug: true } },
    },
  });

  const cities = new Set<string>();
  const areas = new Set<string>();
  for (const property of properties) {
    cities.add(property.city.slug);
    areas.add(`${property.city.slug}/${property.area.slug}`);
  }

  return [
    ...entries,
    ...SEEKER_STATIC_PAGES.map((path) => ({
      url: `${base}${path}`,
      lastModified: now,
      changeFrequency: "daily" as const,
      priority: 0.8,
    })),
    ...[...cities].map((city) => ({
      url: `${base}/pgs/${city}`,
      lastModified: now,
      changeFrequency: "daily" as const,
      priority: 0.8,
    })),
    ...[...areas].map((area) => ({
      url: `${base}/pgs/${area}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
    ...properties.map((property) => ({
      url: `${base}/pg/${property.slug}`,
      lastModified: property.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
  ];
}
