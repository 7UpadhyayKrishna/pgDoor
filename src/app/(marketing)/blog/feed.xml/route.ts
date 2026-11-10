import { siteUrl } from "@/lib/site";
import { listAllPublished } from "@/modules/blog";
import { toFeedPost } from "@/modules/blog/feed-data";
import { rssFeed } from "@/modules/blog/feeds";

export const dynamic = "force-dynamic";

export async function GET() {
  const base = siteUrl();
  const posts = (await listAllPublished()).slice(0, 50).map((p) => toFeedPost(p, base));
  return new Response(rssFeed(posts, base), {
    headers: {
      "content-type": "application/rss+xml; charset=utf-8",
      "cache-control": "public, s-maxage=600, stale-while-revalidate=3600",
    },
  });
}
