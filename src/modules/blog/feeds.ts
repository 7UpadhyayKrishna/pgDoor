import type { Citation, Faq, Statistic } from "@/modules/blog/types";

export type FeedPost = {
  slug: string;
  title: string;
  description: string;
  html?: string;
  markdown: string;
  publishedAt: Date;
  updatedAt: Date;
  authorName?: string | null;
  category?: string | null;
  tags: string[];
  image?: string | null;
  tldr?: string | null;
  keyTakeaways: string[];
  faqs: Faq[];
  statistics: Statistic[];
  citations: Citation[];
  aiSummary?: string | null;
};

function xml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function cdata(value: string) {
  return `<![CDATA[${value.replace(/]]>/g, "]]]]><![CDATA[>")}]]>`;
}

export function rssFeed(posts: FeedPost[], siteUrl: string) {
  const items = posts
    .map((p) => {
      const url = `${siteUrl}/blog/${p.slug}`;
      return [
        "<item>",
        `<title>${xml(p.title)}</title>`,
        `<link>${url}</link>`,
        `<guid isPermaLink="true">${url}</guid>`,
        `<pubDate>${p.publishedAt.toUTCString()}</pubDate>`,
        p.authorName ? `<dc:creator>${xml(p.authorName)}</dc:creator>` : "",
        p.category ? `<category>${xml(p.category)}</category>` : "",
        ...p.tags.map((t) => `<category>${xml(t)}</category>`),
        `<description>${xml(p.description)}</description>`,
        p.html ? `<content:encoded>${cdata(p.html)}</content:encoded>` : "",
        p.image ? `<enclosure url="${xml(p.image)}" type="image/jpeg" length="0" />` : "",
        "</item>",
      ]
        .filter(Boolean)
        .join("");
    })
    .join("\n");
  const updated = posts[0]?.updatedAt ?? new Date();
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:dc="http://purl.org/dc/elements/1.1/">
<channel>
<title>pgDoor Guides</title>
<link>${siteUrl}/blog</link>
<atom:link href="${siteUrl}/blog/feed.xml" rel="self" type="application/rss+xml" />
<description>Guides on finding and living in a PG in Gurgaon and Delhi NCR.</description>
<language>en-IN</language>
<lastBuildDate>${updated.toUTCString()}</lastBuildDate>
${items}
</channel>
</rss>`;
}

export function jsonFeed(posts: FeedPost[], siteUrl: string) {
  return {
    version: "https://jsonfeed.org/version/1.1",
    title: "pgDoor Guides",
    home_page_url: `${siteUrl}/blog`,
    feed_url: `${siteUrl}/blog/feed.json`,
    description: "Guides on finding and living in a PG in Gurgaon and Delhi NCR.",
    language: "en-IN",
    items: posts.map((p) => ({
      id: `${siteUrl}/blog/${p.slug}`,
      url: `${siteUrl}/blog/${p.slug}`,
      title: p.title,
      summary: p.description,
      content_html: p.html,
      content_text: p.markdown,
      image: p.image ?? undefined,
      date_published: p.publishedAt.toISOString(),
      date_modified: p.updatedAt.toISOString(),
      authors: p.authorName ? [{ name: p.authorName }] : undefined,
      tags: [p.category, ...p.tags].filter(Boolean),
    })),
  };
}

/** A post as standalone markdown: the version AI crawlers and llms-full.txt read. */
export function postMarkdown(p: FeedPost, siteUrl: string) {
  const url = `${siteUrl}/blog/${p.slug}`;
  const lines = [
    `# ${p.title}`,
    "",
    `Source: ${url}`,
    `Published: ${p.publishedAt.toISOString().slice(0, 10)} · Updated: ${p.updatedAt.toISOString().slice(0, 10)}${p.authorName ? ` · Author: ${p.authorName}` : ""}`,
    "",
  ];
  if (p.tldr) lines.push("## Summary", "", p.tldr, "");
  if (p.aiSummary) lines.push("## In brief", "", p.aiSummary, "");
  if (p.keyTakeaways.length) lines.push("## Key takeaways", "", ...p.keyTakeaways.map((t) => `- ${t}`), "");
  lines.push(p.markdown, "");
  if (p.statistics.length) {
    lines.push("## Key figures", "", ...p.statistics.map((s) => `- ${s.claim}: ${s.value} (source: [${s.sourceName || s.sourceUrl}](${s.sourceUrl}))`), "");
  }
  if (p.faqs.length) {
    lines.push("## Frequently asked questions", "");
    for (const f of p.faqs) lines.push(`### ${f.q}`, "", f.a, "");
  }
  if (p.citations.length) {
    lines.push("## Sources", "", ...p.citations.map((c) => `- [${c.title}](${c.url})${c.publisher ? ` — ${c.publisher}` : ""}`), "");
  }
  return lines.join("\n").replace(/\n{3,}/g, "\n\n").trim() + "\n";
}

export function llmsTxt(
  input: {
    cities: { name: string; slug: string; count: number }[];
    posts: { slug: string; title: string; summary: string }[];
  },
  siteUrl: string,
) {
  const lines = [
    "# pgDoor",
    "",
    "> pgDoor is a PG (paying guest accommodation) marketplace for Gurgaon and Delhi NCR, India. Tenants search by where they go every day (office, college or metro) and compare PGs by commute time and true monthly cost: rent plus commute fare.",
    "",
    "Key facts:",
    "- Searching is free and doesn't need an account. Enquiries need a one-time code on the tenant's mobile number.",
    "- Listings show rent per bed by room type (single, double, triple), security deposit when the owner has shared it, food, house rules and when availability was last updated.",
    "- A listing is marked Verified only after pgDoor has checked the property itself.",
    "- Owners list for free with no commission.",
    "",
    "## Find PGs",
    "",
    `- [All PGs](${siteUrl}/pgs): search by area, PG name or brand, filter by budget, room type, gender and food.`,
    ...input.cities
      .filter((c) => c.count > 0)
      .map((c) => `- [PGs in ${c.name}](${siteUrl}/pgs/${c.slug}): ${c.count} listed PGs.`),
    "",
    "## How pgDoor works",
    "",
    `- [About](${siteUrl}/about)`,
    `- [Commute and true cost methodology](${siteUrl}/methodology)`,
    `- [Help center](${siteUrl}/help)`,
    `- [List your PG](${siteUrl}/owners)`,
    "",
  ];
  if (input.posts.length) {
    lines.push("## Guides", "", ...input.posts.map((p) => `- [${p.title}](${siteUrl}/blog/md/${p.slug}): ${p.summary}`), "");
  }
  lines.push("## Optional", "", `- [Full text of all guides](${siteUrl}/llms-full.txt)`, `- [RSS feed](${siteUrl}/blog/feed.xml)`, "");
  return lines.join("\n");
}
