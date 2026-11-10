import { siteUrl } from "@/lib/site";
import { listAllPublished, postDescription } from "@/modules/blog";
import { llmsTxt } from "@/modules/blog/feeds";
import { getCachedCityInventory } from "@/modules/locations";

export const dynamic = "force-dynamic";

export async function GET() {
  const base = siteUrl();
  const [posts, cities] = await Promise.all([listAllPublished(), getCachedCityInventory().catch(() => [])]);
  const body = llmsTxt(
    {
      cities,
      posts: posts.map((p) => ({ slug: p.slug, title: p.title, summary: (p.tldr || postDescription(p)).replace(/\s+/g, " ") })),
    },
    base,
  );
  return new Response(body, {
    headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "public, s-maxage=3600, stale-while-revalidate=86400" },
  });
}
