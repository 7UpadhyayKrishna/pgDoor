import { siteUrl } from "@/lib/site";
import { getPublishedPost } from "@/modules/blog";
import { toFeedPost } from "@/modules/blog/feed-data";
import { postMarkdown } from "@/modules/blog/feeds";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params;
  const post = await getPublishedPost(slug);
  if (!post || post.noindex) return new Response("Not found", { status: 404 });
  const base = siteUrl();
  return new Response(postMarkdown(toFeedPost(post, base), base), {
    headers: {
      "content-type": "text/markdown; charset=utf-8",
      "cache-control": "public, s-maxage=600, stale-while-revalidate=3600",
      link: `<${base}/blog/${post.slug}>; rel="canonical"`,
    },
  });
}
