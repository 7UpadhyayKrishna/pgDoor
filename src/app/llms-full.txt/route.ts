import { siteUrl } from "@/lib/site";
import { listAllPublished } from "@/modules/blog";
import { toFeedPost } from "@/modules/blog/feed-data";
import { postMarkdown } from "@/modules/blog/feeds";

export const dynamic = "force-dynamic";

export async function GET() {
  const base = siteUrl();
  const posts = await listAllPublished();
  const header = [
    "# pgDoor guides (full text)",
    "",
    "> Every published pgDoor guide as markdown. pgDoor is a PG marketplace for Gurgaon and Delhi NCR that compares PGs by commute time and true monthly cost.",
    "",
  ].join("\n");
  const body = [header, ...posts.map((p) => postMarkdown(toFeedPost(p, base), base))].join("\n\n---\n\n");
  return new Response(body, {
    headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "public, s-maxage=3600, stale-while-revalidate=86400" },
  });
}
