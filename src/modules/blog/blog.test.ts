import { describe, expect, it } from "vitest";
import { analyzeDoc, docToHtml, docToMarkdown, headingIds, isQuestion, withHeadingIds } from "@/modules/blog/content";
import { articleJsonLd, compact, faqJsonLd, howToJsonLd, jsonLdScript } from "@/modules/blog/jsonld";
import { llmsTxt, postMarkdown, rssFeed, type FeedPost } from "@/modules/blog/feeds";
import { rankRelated } from "@/modules/blog/related";
import { phraseCount, scorePost } from "@/modules/blog/seo-score";
import { emptyPostFields, type DocNode, type PostFields } from "@/modules/blog/types";

const t = (text: string, marks?: DocNode["marks"]): DocNode => ({ type: "text", text, marks });
const p = (...c: DocNode[]): DocNode => ({ type: "paragraph", content: c });
const h = (level: number, text: string): DocNode => ({ type: "heading", attrs: { level }, content: [t(text)] });
const words = (n: number, word = "rent") => Array.from({ length: n }, () => word).join(" ");

const doc: DocNode = {
  type: "doc",
  content: [
    p(t("PG near cyber city guide. "), t("internal", [{ type: "link", attrs: { href: "/pgs/gurgaon" } }])),
    h(2, "What is the rent near Cyber City?"),
    p(t("Most double rooms cost between ₹9,000 and ₹14,000 a month.")),
    h(2, "Deposits"),
    h(3, "Deposits"),
    p(t("See "), t("DMRC", [{ type: "link", attrs: { href: "https://www.delhimetrorail.com", rel: "noopener nofollow" } }])),
    { type: "image", attrs: { src: "/uploads/a.jpg", alt: "" } },
    { type: "pgEmbed", attrs: { slug: "zolo-mansion", title: "Zolo Mansion" } },
  ],
};

describe("analyzeDoc", () => {
  const a = analyzeDoc(doc);

  it("builds a unique table of contents from H2/H3", () => {
    expect(a.toc).toEqual([
      { id: "what-is-the-rent-near-cyber-city", text: "What is the rent near Cyber City?", level: 2 },
      { id: "deposits", text: "Deposits", level: 2 },
      { id: "deposits-2", text: "Deposits", level: 3 },
    ]);
    expect(a.h2Count).toBe(2);
  });

  it("classifies links and counts embeds as internal links", () => {
    expect(a.internalLinks).toBe(2);
    expect(a.externalLinks).toBe(1);
    expect(a.links.find((l) => !l.internal)?.nofollow).toBe(true);
  });

  it("flags images without alt text", () => {
    expect(a.images).toEqual([{ src: "/uploads/a.jpg", alt: "", caption: "" }]);
  });

  it("detects question headings and measures the answer under them", () => {
    expect(a.questionHeadings).toEqual([{ text: "What is the rent near Cyber City?", level: 2, answerWords: 10 }]);
    expect(isQuestion("How to pick a PG")).toBe(true);
    expect(isQuestion("Deposits")).toBe(false);
  });

  it("counts words and reading time", () => {
    expect(a.wordCount).toBeGreaterThan(15);
    expect(a.readingMinutes).toBe(1);
  });

  it("gives headings the same ids the TOC links to", () => {
    const ids: string[] = [];
    const collect = (n: DocNode) => {
      if (n.type === "heading") ids.push(String(n.attrs?.id));
      n.content?.forEach(collect);
    };
    collect(withHeadingIds(doc));
    expect(ids).toEqual(a.toc.map((x) => x.id));
    expect(headingIds(["A", "A", "A"])).toEqual(["a", "a-2", "a-3"]);
  });
});

describe("markdown and html export", () => {
  it("makes relative links absolute and keeps structure", () => {
    const md = docToMarkdown(doc, "https://www.pgdoor.in");
    expect(md).toContain("## What is the rent near Cyber City?");
    expect(md).toContain("[internal](https://www.pgdoor.in/pgs/gurgaon)");
    expect(md).toContain("[Zolo Mansion](https://www.pgdoor.in/pg/zolo-mansion)");
  });

  it("escapes text and drops unsafe link schemes in HTML", () => {
    const html = docToHtml(
      { type: "doc", content: [p(t("<b>x</b>"), t("bad", [{ type: "link", attrs: { href: "javascript:alert(1)" } }]))] },
      "https://www.pgdoor.in",
    );
    expect(html).toContain("&lt;b&gt;x&lt;/b&gt;");
    expect(html).toContain('href="#"');
    expect(html).not.toContain("javascript:");
  });
});

function goodPost(): PostFields {
  return {
    ...emptyPostFields(),
    title: "How to find a PG near Cyber City in Gurgaon",
    slug: "pg-near-cyber-city",
    seoTitle: "PG near Cyber City: rent, commute and deposits",
    metaDescription:
      "Find a PG near Cyber City in Gurgaon: typical rent by room type, commute times by metro and auto, deposits and what to check before you pay anything.",
    focusKeyword: "PG near Cyber City",
    coverImageUrl: "https://cdn.example.com/cover.jpg",
    coverAlt: "PG building",
    tldr: words(50, "answer"),
    keyTakeaways: ["One", "Two", "Three"],
    faqs: [
      { q: "What is the rent?", a: "Double rooms near Cyber City usually cost between nine and fourteen thousand rupees." },
      { q: "Is the deposit refundable?", a: "Usually yes after the notice period, minus any deductions agreed in writing." },
      { q: "How long is the notice period?", a: "Most PGs in Gurgaon ask for fifteen to thirty days of notice before you leave." },
    ],
    aiSummary: words(90, "fact"),
    statistics: [
      { claim: "a", value: "1", sourceUrl: "https://a.example", sourceName: "A" },
      { claim: "b", value: "2", sourceUrl: "https://b.example", sourceName: "B" },
    ],
    citations: [
      { title: "a", url: "https://a.example" },
      { title: "b", url: "https://b.example" },
      { title: "c", url: "https://c.example" },
    ],
    entities: [{ name: "DLF Cyber City", type: "Place", sameAs: "https://en.wikipedia.org/wiki/DLF_CyberCity" }],
    lastFactCheckedAt: "2026-11-01",
    targetCityId: "gurgaon",
  };
}

describe("scorePost", () => {
  const author = { name: "Editor", bio: "Bio", credentials: "Visited 300 PGs", sameAs: ["https://linkedin.com/in/x"] };
  const now = new Date("2026-11-10");

  it("scores an empty draft low and a complete post high", () => {
    const empty = scorePost(emptyPostFields(), analyzeDoc({ type: "doc", content: [] }), null, now);
    expect(empty.total).toBeLessThan(25);

    const post = goodPost();
    const body: DocNode = {
      type: "doc",
      content: [
        p(t(`PG near Cyber City guide. ${words(400)}`)),
        h(2, "What is the rent for a PG near Cyber City?"),
        p(t("Double rooms usually cost nine to fourteen thousand a month near Cyber City.")),
        h(2, "How do I check a PG near Cyber City?"),
        p(t("Visit before paying and ask for the terms in writing.")),
        p(t(`${words(400)} PG near Cyber City `), t("link", [{ type: "link", attrs: { href: "/pgs" } }]), t(" "), t("x", [{ type: "link", attrs: { href: "/blog/a" } }])),
        p(t("source", [{ type: "link", attrs: { href: "https://dmrc.example" } }])),
      ],
    };
    const score = scorePost(post, analyzeDoc(body), author, now);
    const failing = score.checks.filter((c) => c.status === "fail").map((c) => c.id);
    expect(failing).toEqual([]);
    expect(score.aeo).toBeGreaterThanOrEqual(90);
    expect(score.geo).toBe(100);
    expect(score.total).toBeGreaterThanOrEqual(85);
  });

  it("fails keyword stuffing", () => {
    const post = goodPost();
    const stuffed = analyzeDoc({ type: "doc", content: [p(t(Array.from({ length: 60 }, () => "PG near Cyber City").join(" ")))] });
    const density = scorePost(post, stuffed, author, now).checks.find((c) => c.id === "kw-density");
    expect(density?.status).toBe("fail");
  });

  it("requires steps for how-to posts and fresh fact checks", () => {
    const post = { ...goodPost(), schemaType: "HOW_TO" as const, lastFactCheckedAt: "2025-01-01" };
    const score = scorePost(post, analyzeDoc(doc), author, now);
    expect(score.checks.find((c) => c.id === "howto-steps")?.status).toBe("fail");
    expect(score.checks.find((c) => c.id === "freshness")?.status).toBe("warn");
  });

  it("matches phrases on word boundaries", () => {
    expect(phraseCount("pg near cyber city, PG Near Cyber City!", "PG near Cyber City")).toBe(2);
    expect(phraseCount("spgs", "pg")).toBe(0);
    expect(phraseCount("Best PGs near Cyber City", "PG near Cyber City")).toBe(1);
  });
});

describe("JSON-LD", () => {
  it("strips empty values", () => {
    expect(compact({ a: "", b: [], c: { d: undefined }, e: 0, f: ["x", ""] })).toEqual({ e: 0, f: ["x"] });
  });

  it("builds a BlogPosting with author, speakable and entities", () => {
    const ld = articleJsonLd(
      {
        url: "https://www.pgdoor.in/blog/x",
        title: "T",
        description: "D",
        image: "https://cdn/x.jpg",
        publishedAt: new Date("2026-11-01"),
        updatedAt: new Date("2026-11-05"),
        author: { name: "Editor", slug: "editor", sameAs: ["https://linkedin.com/in/x"] },
        tags: ["Gurgaon"],
        keywords: ["pg gurgaon", ""],
        wordCount: 900,
        schemaType: "BLOG_POSTING",
        speakable: true,
        entities: [{ name: "Gurgaon", type: "City", sameAs: "https://en.wikipedia.org/wiki/Gurgaon" }],
        citations: [{ title: "Src", url: "https://src" }],
        targetPlace: { name: "Gurgaon" },
      },
      "https://www.pgdoor.in",
    ) as Record<string, unknown>;
    expect(ld["@type"]).toBe("BlogPosting");
    expect(ld.keywords).toBe("pg gurgaon, Gurgaon");
    expect(ld.about).toEqual({ "@type": "City", name: "Gurgaon", sameAs: "https://en.wikipedia.org/wiki/Gurgaon" });
    expect(ld.speakable).toEqual({ "@type": "SpeakableSpecification", cssSelector: [".post-tldr", ".post-takeaways"] });
    expect(ld.reviewedBy).toBeUndefined();
    expect(JSON.stringify(ld)).not.toContain('""');
  });

  it("only emits FAQ and HowTo when there is content", () => {
    expect(faqJsonLd([{ q: "", a: "" }], "u")).toBeNull();
    expect(faqJsonLd([{ q: "Q?", a: "A" }], "u")?.mainEntity).toHaveLength(1);
    expect(howToJsonLd({ title: "t", description: "d", steps: [{ name: "a", text: "b" }] }, "u")).toBeNull();
  });

  it("escapes </script> in JSON-LD", () => {
    expect(jsonLdScript({ a: "</script>" })).not.toContain("</script>");
  });
});

describe("rankRelated", () => {
  const base = { publishedAt: new Date("2026-01-01") };
  it("prefers shared tags, then category, then city, then recency", () => {
    const target = { id: "t", categoryId: "c1", targetCityId: "g", tagIds: ["a", "b"], publishedAt: null };
    const ranked = rankRelated(target, [
      { id: "city", categoryId: null, targetCityId: "g", tagIds: [], ...base },
      { id: "tags", categoryId: null, targetCityId: null, tagIds: ["a", "b"], ...base },
      { id: "cat", categoryId: "c1", targetCityId: null, tagIds: [], ...base },
      { id: "t", categoryId: "c1", targetCityId: "g", tagIds: ["a"], ...base },
    ]);
    expect(ranked.map((r) => r.id)).toEqual(["tags", "cat", "city"]);
  });
});

describe("feeds", () => {
  const post: FeedPost = {
    slug: "x",
    title: "Rent & deposits <2026>",
    description: "D",
    html: "<p>Body ]]> end</p>",
    markdown: "Body",
    publishedAt: new Date("2026-11-01T00:00:00Z"),
    updatedAt: new Date("2026-11-02T00:00:00Z"),
    authorName: "Editor",
    category: "Guides",
    tags: ["Gurgaon"],
    tldr: "Short answer.",
    keyTakeaways: ["One"],
    faqs: [{ q: "Q?", a: "A." }],
    statistics: [{ claim: "Days", value: "22", sourceUrl: "https://s", sourceName: "S" }],
    citations: [{ title: "Src", url: "https://src" }],
    aiSummary: "Summary for AI.",
  };

  it("escapes XML and CDATA in RSS", () => {
    const rss = rssFeed([post], "https://www.pgdoor.in");
    expect(rss).toContain("<title>Rent &amp; deposits &lt;2026&gt;</title>");
    expect(rss).toContain("]]]]><![CDATA[>");
    expect(rss).toContain("<link>https://www.pgdoor.in/blog/x</link>");
  });

  it("writes a complete markdown version for AI crawlers", () => {
    const md = postMarkdown(post, "https://www.pgdoor.in");
    for (const part of ["# Rent & deposits", "## Summary", "## In brief", "## Key takeaways", "## Key figures", "### Q?", "## Sources"]) {
      expect(md).toContain(part);
    }
  });

  it("lists live cities and guides in llms.txt", () => {
    const txt = llmsTxt(
      { cities: [{ name: "Gurgaon", slug: "gurgaon", count: 50 }, { name: "Noida", slug: "noida", count: 0 }], posts: [{ slug: "x", title: "X", summary: "S" }] },
      "https://www.pgdoor.in",
    );
    expect(txt.startsWith("# pgDoor")).toBe(true);
    expect(txt).toContain("[PGs in Gurgaon](https://www.pgdoor.in/pgs/gurgaon)");
    expect(txt).not.toContain("Noida](");
    expect(txt).toContain("[X](https://www.pgdoor.in/blog/md/x): S");
  });
});
