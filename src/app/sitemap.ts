import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { isPrelaunch } from "@/lib/launch";
import { siteUrl } from "@/lib/site";
import { listAllPublished } from "@/modules/blog";

export const dynamic = "force-dynamic";

const STATIC_PAGES = ["/", "/owners", "/owners/register", "/about", "/help", "/contact", "/privacy", "/terms", "/refund-policy", "/blog"];
const SEEKER_STATIC_PAGES = ["/pgs", "/compare"];

async function blogEntries(base: string): Promise<MetadataRoute.Sitemap> {
  // Posts canonicalised to another site shouldn't be listed as ours.
  const posts = (await listAllPublished()).filter((post) => !post.canonicalUrl);
  const latest = new Map<string, Date>();
  const bump = (path: string, date: Date) => {
    const current = latest.get(path);
    if (!current || current < date) latest.set(path, date);
  };
  for (const post of posts) {
    if (post.category) bump(`/blog/category/${post.category.slug}`, post.updatedAt);
    if (post.author) bump(`/blog/author/${post.author.slug}`, post.updatedAt);
  }
  const tagCounts = new Map<string, number>();
  for (const post of posts) for (const { tag } of post.tags) tagCounts.set(tag.slug, (tagCounts.get(tag.slug) ?? 0) + 1);
  for (const post of posts) {
    for (const { tag } of post.tags) if ((tagCounts.get(tag.slug) ?? 0) >= 2) bump(`/blog/tag/${tag.slug}`, post.updatedAt);
  }
  return [
    ...posts.map((post) => {
      const images = [post.coverImageUrl, post.ogImageUrl].filter((u): u is string => Boolean(u));
      return {
        url: `${base}/blog/${post.slug}`,
        lastModified: post.updatedAt,
        changeFrequency: "weekly" as const,
        priority: 0.7,
        images: images.map((u) => (u.startsWith("/") ? `${base}${u}` : u)),
      };
    }),
    ...[...latest].map(([path, lastModified]) => ({
      url: `${base}${path}`,
      lastModified,
      changeFrequency: "weekly" as const,
      priority: 0.5,
    })),
  ];
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const now = new Date();
  const entries: MetadataRoute.Sitemap = STATIC_PAGES.map((path) => ({
    url: `${base}${path}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: path === "/" ? 1 : 0.5,
  }));

  entries.push(...(await blogEntries(base)));

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
