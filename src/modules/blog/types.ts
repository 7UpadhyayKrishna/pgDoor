/** Shared, client-safe blog types (no Prisma imports). */

export type DocMark = { type: string; attrs?: Record<string, unknown> };

export type DocNode = {
  type?: string;
  attrs?: Record<string, unknown>;
  content?: DocNode[];
  marks?: readonly DocMark[];
  text?: string;
};

export type Faq = { q: string; a: string };
export type HowToStep = { name: string; text: string; imageUrl?: string };
export type Statistic = { claim: string; value: string; sourceUrl: string; sourceName: string };
export type Citation = { title: string; url: string; publisher?: string; accessedAt?: string };
export type Entity = { name: string; type?: string; sameAs?: string };
export type TocItem = { id: string; text: string; level: number };

export type SchemaType = "BLOG_POSTING" | "ARTICLE" | "HOW_TO" | "NEWS_ARTICLE";
export type BlogStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";

export const SCHEMA_TYPE_LABEL: Record<SchemaType, string> = {
  BLOG_POSTING: "Blog post",
  ARTICLE: "Article",
  HOW_TO: "How-to guide",
  NEWS_ARTICLE: "News",
};

export const BLOG_STATUS_LABEL: Record<BlogStatus, string> = {
  DRAFT: "Draft",
  PUBLISHED: "Published",
  ARCHIVED: "Archived",
};

/** Everything the editor edits and the score reads; mirrors the BlogPost columns. */
export type PostFields = {
  title: string;
  slug: string;
  subtitle: string;
  excerpt: string;
  contentJson: DocNode;
  coverImageUrl: string;
  coverAlt: string;
  authorId: string;
  reviewerId: string;
  categoryId: string;
  tagIds: string[];
  seoTitle: string;
  metaDescription: string;
  focusKeyword: string;
  secondaryKeywords: string[];
  canonicalUrl: string;
  noindex: boolean;
  nofollow: boolean;
  ogTitle: string;
  ogDescription: string;
  ogImageUrl: string;
  twitterTitle: string;
  twitterDescription: string;
  schemaType: SchemaType;
  tldr: string;
  keyTakeaways: string[];
  faqs: Faq[];
  howToSteps: HowToStep[];
  speakable: boolean;
  aiSummary: string;
  statistics: Statistic[];
  citations: Citation[];
  entities: Entity[];
  lastFactCheckedAt: string;
  targetCityId: string;
  targetAreaId: string;
  relatedPropertyIds: string[];
};

export const EMPTY_DOC: DocNode = { type: "doc", content: [{ type: "paragraph" }] };

export function emptyPostFields(): PostFields {
  return {
    title: "",
    slug: "",
    subtitle: "",
    excerpt: "",
    contentJson: EMPTY_DOC,
    coverImageUrl: "",
    coverAlt: "",
    authorId: "",
    reviewerId: "",
    categoryId: "",
    tagIds: [],
    seoTitle: "",
    metaDescription: "",
    focusKeyword: "",
    secondaryKeywords: [],
    canonicalUrl: "",
    noindex: false,
    nofollow: false,
    ogTitle: "",
    ogDescription: "",
    ogImageUrl: "",
    twitterTitle: "",
    twitterDescription: "",
    schemaType: "BLOG_POSTING",
    tldr: "",
    keyTakeaways: [],
    faqs: [],
    howToSteps: [],
    speakable: true,
    aiSummary: "",
    statistics: [],
    citations: [],
    entities: [],
    lastFactCheckedAt: "",
    targetCityId: "",
    targetAreaId: "",
    relatedPropertyIds: [],
  };
}

/** Author fields the GEO checks look at. */
export type AuthorSignals = {
  name: string;
  bio?: string | null;
  credentials?: string | null;
  sameAs?: string[];
} | null;
