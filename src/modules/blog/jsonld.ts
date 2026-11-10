import type { Citation, Entity, Faq, HowToStep, SchemaType } from "@/modules/blog/types";

type Json = Record<string, unknown>;

/** Drops undefined/null/empty strings/empty arrays/empty objects so search engines never see blank properties. */
export function compact<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map(compact).filter((v) => !isEmpty(v)) as T;
  }
  if (value && typeof value === "object" && !(value instanceof Date)) {
    const out: Json = {};
    for (const [key, v] of Object.entries(value as Json)) {
      const next = compact(v);
      if (!isEmpty(next)) out[key] = next;
    }
    return out as T;
  }
  return value;
}

function isEmpty(v: unknown) {
  if (v == null) return true;
  if (typeof v === "string") return v.trim() === "";
  if (Array.isArray(v)) return v.length === 0;
  if (typeof v === "object" && !(v instanceof Date)) return Object.keys(v as Json).length === 0;
  return false;
}

const SCHEMA_TYPE: Record<SchemaType, string> = {
  BLOG_POSTING: "BlogPosting",
  ARTICLE: "Article",
  HOW_TO: "Article",
  NEWS_ARTICLE: "NewsArticle",
};

export type JsonLdAuthor = {
  name: string;
  slug: string;
  jobTitle?: string | null;
  bio?: string | null;
  credentials?: string | null;
  expertise?: string[];
  avatarUrl?: string | null;
  sameAs?: string[];
};

export function organizationJsonLd(siteUrl: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${siteUrl}/#organization`,
    name: "pgDoor",
    url: siteUrl,
    logo: { "@type": "ImageObject", url: `${siteUrl}/icon.svg` },
    description: "pgDoor helps tenants find PGs in Gurgaon and NCR by daily commute, rent and true monthly cost.",
    areaServed: [
      { "@type": "City", name: "Gurgaon" },
      { "@type": "AdministrativeArea", name: "Delhi NCR" },
    ],
    email: "hello@pgdoor.in",
  };
}

export function websiteJsonLd(siteUrl: string) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${siteUrl}/#website`,
    name: "pgDoor",
    url: siteUrl,
    inLanguage: "en-IN",
    publisher: { "@id": `${siteUrl}/#organization` },
    potentialAction: {
      "@type": "SearchAction",
      target: { "@type": "EntryPoint", urlTemplate: `${siteUrl}/pgs?q={search_term_string}` },
      "query-input": "required name=search_term_string",
    },
  };
}

export function personJsonLd(author: JsonLdAuthor, siteUrl: string) {
  return compact({
    "@context": "https://schema.org",
    "@type": "Person",
    "@id": `${siteUrl}/blog/author/${author.slug}#person`,
    name: author.name,
    url: `${siteUrl}/blog/author/${author.slug}`,
    jobTitle: author.jobTitle,
    description: author.bio,
    hasCredential: author.credentials
      ? { "@type": "EducationalOccupationalCredential", name: author.credentials }
      : undefined,
    knowsAbout: author.expertise,
    image: author.avatarUrl,
    sameAs: author.sameAs,
    worksFor: { "@id": `${siteUrl}/#organization` },
  });
}

export type ArticleJsonLdInput = {
  url: string;
  title: string;
  description: string;
  image?: string | null;
  imageAlt?: string | null;
  publishedAt?: Date | null;
  updatedAt: Date;
  author?: JsonLdAuthor | null;
  reviewer?: JsonLdAuthor | null;
  category?: string | null;
  tags: string[];
  keywords: string[];
  wordCount: number;
  schemaType: SchemaType;
  speakable: boolean;
  entities: Entity[];
  citations: Citation[];
  targetPlace?: { name: string; city?: string | null } | null;
  lastReviewed?: Date | null;
};

export function articleJsonLd(input: ArticleJsonLdInput, siteUrl: string) {
  const author = input.author
    ? {
        "@type": "Person",
        "@id": `${siteUrl}/blog/author/${input.author.slug}#person`,
        name: input.author.name,
        url: `${siteUrl}/blog/author/${input.author.slug}`,
        jobTitle: input.author.jobTitle,
        sameAs: input.author.sameAs,
      }
    : { "@id": `${siteUrl}/#organization` };
  const [about, ...mentions] = input.entities.map((e) =>
    compact({ "@type": e.type || "Thing", name: e.name, sameAs: e.sameAs }),
  );
  return compact({
    "@context": "https://schema.org",
    "@type": SCHEMA_TYPE[input.schemaType],
    "@id": `${input.url}#article`,
    headline: input.title.slice(0, 110),
    description: input.description,
    image: input.image ? [{ "@type": "ImageObject", url: input.image, caption: input.imageAlt }] : undefined,
    datePublished: input.publishedAt?.toISOString(),
    dateModified: input.updatedAt.toISOString(),
    author,
    reviewedBy: input.reviewer
      ? { "@type": "Person", name: input.reviewer.name, url: `${siteUrl}/blog/author/${input.reviewer.slug}` }
      : undefined,
    lastReviewed: input.lastReviewed?.toISOString(),
    publisher: { "@id": `${siteUrl}/#organization` },
    mainEntityOfPage: { "@type": "WebPage", "@id": input.url },
    isPartOf: { "@id": `${siteUrl}/#website` },
    inLanguage: "en-IN",
    wordCount: input.wordCount || undefined,
    articleSection: input.category,
    keywords: [...new Set([...input.keywords, ...input.tags].map((k) => k.trim()).filter(Boolean))].join(", "),
    about,
    mentions,
    citation: input.citations.map((c) =>
      compact({ "@type": "CreativeWork", name: c.title, url: c.url, publisher: c.publisher }),
    ),
    contentLocation: input.targetPlace
      ? compact({
          "@type": "Place",
          name: input.targetPlace.name,
          containedInPlace: input.targetPlace.city ? { "@type": "City", name: input.targetPlace.city } : undefined,
        })
      : undefined,
    speakable: input.speakable
      ? { "@type": "SpeakableSpecification", cssSelector: [".post-tldr", ".post-takeaways"] }
      : undefined,
  });
}

export function faqJsonLd(faqs: Faq[], url: string) {
  const items = faqs.filter((f) => f.q.trim() && f.a.trim());
  if (!items.length) return null;
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "@id": `${url}#faq`,
    mainEntity: items.map((f) => ({
      "@type": "Question",
      name: f.q.trim(),
      acceptedAnswer: { "@type": "Answer", text: f.a.trim() },
    })),
  };
}

export function howToJsonLd(
  input: { title: string; description: string; image?: string | null; steps: HowToStep[]; totalMinutes?: number },
  url: string,
) {
  const steps = input.steps.filter((s) => s.name.trim() && s.text.trim());
  if (steps.length < 2) return null;
  return compact({
    "@context": "https://schema.org",
    "@type": "HowTo",
    "@id": `${url}#howto`,
    name: input.title,
    description: input.description,
    image: input.image,
    totalTime: input.totalMinutes ? `PT${input.totalMinutes}M` : undefined,
    step: steps.map((s, i) =>
      compact({
        "@type": "HowToStep",
        position: i + 1,
        name: s.name.trim(),
        text: s.text.trim(),
        image: s.imageUrl,
        url: `${url}#step-${i + 1}`,
      }),
    ),
  });
}

export function breadcrumbJsonLd(items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export function collectionJsonLd(
  input: { name: string; description?: string | null; url: string; posts: { title: string; url: string }[] },
) {
  return compact({
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: input.name,
    description: input.description,
    url: input.url,
    inLanguage: "en-IN",
    mainEntity: {
      "@type": "ItemList",
      itemListElement: input.posts.map((p, i) => ({ "@type": "ListItem", position: i + 1, url: p.url, name: p.title })),
    },
  });
}

/** Safe to drop inside <script type="application/ld+json">: `<` can't close the tag. */
export function jsonLdScript(data: unknown) {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
