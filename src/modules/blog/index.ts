import { z } from "zod";
import { revalidatePath } from "next/cache";
import { Prisma, type BlogPost } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { HttpError } from "@/lib/rbac";
import { slugify } from "@/lib/utils";
import { analyzeDoc, countWords } from "@/modules/blog/content";
import { rankRelated } from "@/modules/blog/related";
import { scorePost } from "@/modules/blog/seo-score";
import { propertyTextWhere } from "@/modules/search/text-query";
import type { Citation, DocNode, Entity, Faq, HowToStep, PostFields, Statistic, TocItem } from "@/modules/blog/types";

export const BLOG_PAGE_SIZE = 12;

const text = (max: number) => z.string().trim().max(max);
const url = z.union([z.literal(""), z.string().trim().url("Enter a full https:// link").max(2000)]);
const imageUrl = z.union([z.literal(""), z.string().trim().max(2000)]);

export const postPatchSchema = z
  .object({
    title: text(200),
    slug: text(120),
    subtitle: text(300),
    excerpt: text(1000),
    contentJson: z.record(z.string(), z.unknown()),
    coverImageUrl: imageUrl,
    coverAlt: text(300),
    authorId: z.string().max(40),
    reviewerId: z.string().max(40),
    categoryId: z.string().max(40),
    tagIds: z.array(z.string().max(40)).max(20),
    seoTitle: text(120),
    metaDescription: text(320),
    focusKeyword: text(100),
    secondaryKeywords: z.array(text(100)).max(10),
    canonicalUrl: url,
    noindex: z.boolean(),
    nofollow: z.boolean(),
    ogTitle: text(200),
    ogDescription: text(400),
    ogImageUrl: imageUrl,
    twitterTitle: text(200),
    twitterDescription: text(400),
    schemaType: z.enum(["BLOG_POSTING", "ARTICLE", "HOW_TO", "NEWS_ARTICLE"]),
    tldr: text(1500),
    keyTakeaways: z.array(text(400)).max(12),
    faqs: z.array(z.object({ q: text(300), a: text(2000) })).max(30),
    howToSteps: z.array(z.object({ name: text(200), text: text(2000), imageUrl: imageUrl.optional() })).max(40),
    speakable: z.boolean(),
    aiSummary: text(3000),
    statistics: z
      .array(z.object({ claim: text(300), value: text(100), sourceUrl: url, sourceName: text(200) }))
      .max(30),
    citations: z
      .array(z.object({ title: text(300), url, publisher: text(200).optional(), accessedAt: text(40).optional() }))
      .max(50),
    entities: z.array(z.object({ name: text(200), type: text(60).optional(), sameAs: url.optional() })).max(30),
    lastFactCheckedAt: z.union([z.literal(""), z.string().regex(/^\d{4}-\d{2}-\d{2}/)]),
    targetCityId: z.string().max(40),
    targetAreaId: z.string().max(40),
    relatedPropertyIds: z.array(z.string().max(40)).max(20),
    status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]),
  })
  .partial();

export type PostPatch = z.infer<typeof postPatchSchema>;

const postInclude = {
  author: true,
  reviewer: true,
  category: true,
  tags: { include: { tag: true } },
  targetCity: { select: { id: true, name: true, slug: true } },
  targetArea: { select: { id: true, name: true, slug: true } },
} satisfies Prisma.BlogPostInclude;

export type PostWithRelations = Prisma.BlogPostGetPayload<{ include: typeof postInclude }>;

const json = <T>(value: unknown, fallback: T): T => (Array.isArray(value) || (value && typeof value === "object") ? (value as T) : fallback);
const nullable = (v: string | undefined) => (v === undefined ? undefined : v.trim() || null);

/** DB row -> editor fields (empty strings instead of nulls). */
export function toFields(post: PostWithRelations): PostFields {
  return {
    title: post.title,
    slug: post.slug,
    subtitle: post.subtitle ?? "",
    excerpt: post.excerpt ?? "",
    contentJson: json<DocNode>(post.contentJson, { type: "doc", content: [] }),
    coverImageUrl: post.coverImageUrl ?? "",
    coverAlt: post.coverAlt ?? "",
    authorId: post.authorId ?? "",
    reviewerId: post.reviewerId ?? "",
    categoryId: post.categoryId ?? "",
    tagIds: post.tags.map((t) => t.tagId),
    seoTitle: post.seoTitle ?? "",
    metaDescription: post.metaDescription ?? "",
    focusKeyword: post.focusKeyword ?? "",
    secondaryKeywords: post.secondaryKeywords,
    canonicalUrl: post.canonicalUrl ?? "",
    noindex: post.noindex,
    nofollow: post.nofollow,
    ogTitle: post.ogTitle ?? "",
    ogDescription: post.ogDescription ?? "",
    ogImageUrl: post.ogImageUrl ?? "",
    twitterTitle: post.twitterTitle ?? "",
    twitterDescription: post.twitterDescription ?? "",
    schemaType: post.schemaType,
    tldr: post.tldr ?? "",
    keyTakeaways: post.keyTakeaways,
    faqs: json<Faq[]>(post.faqs, []),
    howToSteps: json<HowToStep[]>(post.howToSteps, []),
    speakable: post.speakable,
    aiSummary: post.aiSummary ?? "",
    statistics: json<Statistic[]>(post.statistics, []),
    citations: json<Citation[]>(post.citations, []),
    entities: json<Entity[]>(post.entities, []),
    lastFactCheckedAt: post.lastFactCheckedAt ? post.lastFactCheckedAt.toISOString().slice(0, 10) : "",
    targetCityId: post.targetCityId ?? "",
    targetAreaId: post.targetAreaId ?? "",
    relatedPropertyIds: post.relatedPropertyIds,
  };
}

export function postScore(post: PostWithRelations) {
  const fields = toFields(post);
  return scorePost(fields, analyzeDoc(fields.contentJson), post.author);
}

async function uniquePostSlug(base: string, excludeId?: string) {
  const root = slugify(base) || "post";
  let slug = root;
  for (let i = 2; ; i += 1) {
    const taken = await prisma.blogPost.findUnique({ where: { slug }, select: { id: true } });
    if (!taken || taken.id === excludeId) return slug;
    slug = `${root}-${i}`;
  }
}

export async function createPost(userId: string) {
  const author = await prisma.blogAuthor.findUnique({ where: { userId }, select: { id: true } });
  const slug = await uniquePostSlug(`untitled-${Date.now().toString(36)}`);
  return prisma.blogPost.create({
    data: {
      title: "Untitled post",
      slug,
      contentJson: { type: "doc", content: [{ type: "paragraph" }] },
      authorId: author?.id ?? null,
    },
    select: { id: true },
  });
}

export async function getAdminPost(id: string) {
  const post = await prisma.blogPost.findUnique({ where: { id }, include: postInclude });
  if (!post) throw new HttpError(404, "Post not found");
  return post;
}

export async function listAdminPosts(filters: { status?: string; categoryId?: string; authorId?: string; q?: string }) {
  const where: Prisma.BlogPostWhereInput = {};
  if (filters.status === "DRAFT" || filters.status === "PUBLISHED" || filters.status === "ARCHIVED") where.status = filters.status;
  if (filters.categoryId) where.categoryId = filters.categoryId;
  if (filters.authorId) where.authorId = filters.authorId;
  if (filters.q?.trim()) {
    where.OR = [
      { title: { contains: filters.q.trim(), mode: "insensitive" } },
      { focusKeyword: { contains: filters.q.trim(), mode: "insensitive" } },
    ];
  }
  const posts = await prisma.blogPost.findMany({ where, include: postInclude, orderBy: { updatedAt: "desc" }, take: 200 });
  return posts.map((post) => ({ post, score: postScore(post) }));
}

function nullableDate(value: string | undefined) {
  if (value === undefined) return undefined;
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

export async function updatePost(id: string, patch: PostPatch) {
  const current = await getAdminPost(id);
  const data: Prisma.BlogPostUncheckedUpdateInput = {};

  if (patch.title !== undefined) data.title = patch.title || "Untitled post";
  if (patch.slug !== undefined) data.slug = await uniquePostSlug(patch.slug || patch.title || current.title, id);
  for (const key of [
    "subtitle",
    "excerpt",
    "coverImageUrl",
    "coverAlt",
    "seoTitle",
    "metaDescription",
    "focusKeyword",
    "canonicalUrl",
    "ogTitle",
    "ogDescription",
    "ogImageUrl",
    "twitterTitle",
    "twitterDescription",
    "tldr",
    "aiSummary",
  ] as const) {
    if (patch[key] !== undefined) data[key] = nullable(patch[key]);
  }
  for (const key of ["authorId", "reviewerId", "categoryId", "targetCityId", "targetAreaId"] as const) {
    if (patch[key] !== undefined) data[key] = patch[key] || null;
  }
  for (const key of ["noindex", "nofollow", "speakable", "schemaType"] as const) {
    if (patch[key] !== undefined) (data as Record<string, unknown>)[key] = patch[key];
  }
  if (patch.secondaryKeywords) data.secondaryKeywords = patch.secondaryKeywords.filter(Boolean);
  if (patch.keyTakeaways) data.keyTakeaways = patch.keyTakeaways.map((t) => t.trim()).filter(Boolean);
  if (patch.relatedPropertyIds) data.relatedPropertyIds = [...new Set(patch.relatedPropertyIds)];
  if (patch.faqs) data.faqs = patch.faqs.filter((f) => f.q || f.a);
  if (patch.howToSteps) data.howToSteps = patch.howToSteps.filter((s) => s.name || s.text);
  if (patch.statistics) data.statistics = patch.statistics.filter((s) => s.claim || s.value);
  if (patch.citations) data.citations = patch.citations.filter((c) => c.title || c.url);
  if (patch.entities) data.entities = patch.entities.filter((e) => e.name);
  if (patch.lastFactCheckedAt !== undefined) data.lastFactCheckedAt = nullableDate(patch.lastFactCheckedAt);

  if (patch.contentJson) {
    const doc = patch.contentJson as DocNode;
    const analysis = analyzeDoc(doc);
    data.contentJson = doc as Prisma.InputJsonValue;
    data.wordCount = analysis.wordCount;
    data.readingMinutes = analysis.readingMinutes;
    data.toc = analysis.toc as unknown as Prisma.InputJsonValue;
    data.plainText = analysis.plainText;
  }

  if (patch.status && patch.status !== current.status) {
    if (patch.status === "PUBLISHED") {
      const title = patch.title ?? current.title;
      const words = patch.contentJson ? analyzeDoc(patch.contentJson as DocNode).wordCount : current.wordCount;
      if (!title.trim() || title === "Untitled post") throw new HttpError(422, "Give the post a real title before publishing");
      if (words < 50) throw new HttpError(422, "Write at least 50 words before publishing");
      if (current.slug.startsWith("untitled-") && !patch.slug) {
        data.slug = await uniquePostSlug(title, id);
      }
      if (!current.publishedAt) data.publishedAt = new Date();
    }
    data.status = patch.status;
  }

  const updated = await prisma.$transaction(async (tx) => {
    if (patch.tagIds) {
      await tx.blogPostTag.deleteMany({ where: { postId: id } });
      if (patch.tagIds.length) {
        await tx.blogPostTag.createMany({ data: [...new Set(patch.tagIds)].map((tagId) => ({ postId: id, tagId })) });
      }
    }
    return tx.blogPost.update({ where: { id }, data, include: postInclude });
  });

  if (current.status === "PUBLISHED" || updated.status === "PUBLISHED") {
    revalidateBlog([current, updated]);
  }
  return updated;
}

export async function deletePost(id: string) {
  const post = await getAdminPost(id);
  await prisma.blogPost.delete({ where: { id } });
  if (post.status === "PUBLISHED") revalidateBlog([post]);
}

function revalidateBlog(posts: PostWithRelations[]) {
  const paths = new Set(["/blog", "/sitemap.xml", "/llms.txt", "/llms-full.txt", "/blog/feed.xml", "/blog/feed.json"]);
  for (const p of posts) {
    paths.add(`/blog/${p.slug}`);
    paths.add(`/blog/md/${p.slug}`);
    if (p.category) paths.add(`/blog/category/${p.category.slug}`);
    if (p.author) paths.add(`/blog/author/${p.author.slug}`);
    for (const t of p.tags) paths.add(`/blog/tag/${t.tag.slug}`);
  }
  for (const path of paths) {
    try {
      revalidatePath(path);
    } catch {
      // Outside a request (scripts/tests) there is nothing to revalidate.
    }
  }
}

// ---------- Public reads ----------

function publishedWhere(): Prisma.BlogPostWhereInput {
  return { status: "PUBLISHED", publishedAt: { lte: new Date() } };
}

export async function getPublishedPost(slug: string, opts: { preview?: boolean } = {}) {
  const post = await prisma.blogPost.findUnique({ where: { slug }, include: postInclude });
  if (!post) return null;
  if (post.status === "PUBLISHED" || opts.preview) return post;
  return null;
}

export async function listPublished(filters: {
  categorySlug?: string;
  tagSlug?: string;
  authorSlug?: string;
  page?: number;
  pageSize?: number;
}) {
  const where: Prisma.BlogPostWhereInput = publishedWhere();
  if (filters.categorySlug) where.category = { slug: filters.categorySlug };
  if (filters.tagSlug) where.tags = { some: { tag: { slug: filters.tagSlug } } };
  if (filters.authorSlug) where.author = { slug: filters.authorSlug };
  const pageSize = filters.pageSize ?? BLOG_PAGE_SIZE;
  const page = Math.max(1, filters.page ?? 1);
  const [total, posts] = await Promise.all([
    prisma.blogPost.count({ where }),
    prisma.blogPost.findMany({
      where,
      include: postInclude,
      orderBy: { publishedAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);
  return { total, page, pageSize, pages: Math.max(1, Math.ceil(total / pageSize)), posts };
}

export async function listAllPublished() {
  return prisma.blogPost.findMany({
    where: { ...publishedWhere(), noindex: false },
    include: postInclude,
    orderBy: { publishedAt: "desc" },
  });
}

export async function relatedPosts(post: PostWithRelations, limit = 3) {
  const candidates = await prisma.blogPost.findMany({
    where: { ...publishedWhere(), id: { not: post.id } },
    include: postInclude,
    orderBy: { publishedAt: "desc" },
    take: 60,
  });
  const toCandidate = (p: PostWithRelations) => ({ ...p, tagIds: p.tags.map((t) => t.tagId) });
  return rankRelated(toCandidate(post), candidates.map(toCandidate), limit);
}

export function postDescription(post: Pick<BlogPost, "metaDescription" | "excerpt" | "tldr" | "plainText">) {
  const raw = post.metaDescription || post.excerpt || post.tldr || post.plainText;
  if (!raw) return "";
  if (raw.length <= 160) return raw;
  return `${raw.slice(0, 157).replace(/\s+\S*$/, "")}…`;
}

export function postToc(post: Pick<BlogPost, "toc">) {
  return json<TocItem[]>(post.toc, []);
}

export { countWords };

// ---------- Taxonomies and authors ----------

export const taxonomySchema = z.object({
  name: text(120).min(2, "Enter a name"),
  slug: text(120).optional(),
  description: text(2000).optional(),
  seoTitle: text(120).optional(),
  metaDescription: text(320).optional(),
});

export const authorSchema = z.object({
  name: text(120).min(2, "Enter a name"),
  slug: text(120).optional(),
  jobTitle: text(160).optional(),
  bio: text(3000).optional(),
  credentials: text(500).optional(),
  expertise: z.array(text(80)).max(20).default([]),
  avatarUrl: imageUrl.optional(),
  sameAs: z.array(z.string().trim().url("Profile links must be full https:// URLs")).max(10).default([]),
  userId: z.string().max(40).optional(),
});

type Taxonomy = "category" | "tag";

function taxonomyModel(kind: Taxonomy) {
  return kind === "category" ? prisma.blogCategory : prisma.blogTag;
}

async function uniqueTaxonomySlug(kind: Taxonomy | "author", base: string, excludeId?: string) {
  const root = slugify(base) || kind;
  let slug = root;
  for (let i = 2; ; i += 1) {
    const taken =
      kind === "author"
        ? await prisma.blogAuthor.findUnique({ where: { slug }, select: { id: true } })
        : kind === "category"
          ? await prisma.blogCategory.findUnique({ where: { slug }, select: { id: true } })
          : await prisma.blogTag.findUnique({ where: { slug }, select: { id: true } });
    if (!taken || taken.id === excludeId) return slug;
    slug = `${root}-${i}`;
  }
}

export async function listTaxonomy(kind: Taxonomy) {
  if (kind === "category") {
    return prisma.blogCategory.findMany({ orderBy: { name: "asc" }, include: { _count: { select: { posts: true } } } });
  }
  return prisma.blogTag.findMany({ orderBy: { name: "asc" }, include: { _count: { select: { posts: true } } } });
}

export async function saveTaxonomy(kind: Taxonomy, input: z.infer<typeof taxonomySchema>, id?: string) {
  const data = {
    name: input.name,
    slug: await uniqueTaxonomySlug(kind, input.slug || input.name, id),
    description: input.description || null,
    seoTitle: input.seoTitle || null,
    metaDescription: input.metaDescription || null,
  };
  const model = taxonomyModel(kind) as typeof prisma.blogCategory;
  const row = id ? await model.update({ where: { id }, data }) : await model.create({ data });
  try {
    revalidatePath(`/blog/${kind}/${row.slug}`);
    revalidatePath("/blog");
  } catch {}
  return row;
}

export async function deleteTaxonomy(kind: Taxonomy, id: string) {
  const model = taxonomyModel(kind) as typeof prisma.blogCategory;
  await model.delete({ where: { id } });
}

export async function listAuthors() {
  return prisma.blogAuthor.findMany({ orderBy: { name: "asc" }, include: { _count: { select: { posts: true } } } });
}

export async function getAuthorBySlug(slug: string) {
  return prisma.blogAuthor.findUnique({ where: { slug } });
}

export async function saveAuthor(input: z.infer<typeof authorSchema>, id?: string) {
  const data = {
    name: input.name,
    slug: await uniqueTaxonomySlug("author", input.slug || input.name, id),
    jobTitle: input.jobTitle || null,
    bio: input.bio || null,
    credentials: input.credentials || null,
    expertise: input.expertise.filter(Boolean),
    avatarUrl: input.avatarUrl || null,
    sameAs: input.sameAs,
    userId: input.userId || null,
  };
  const row = id ? await prisma.blogAuthor.update({ where: { id }, data }) : await prisma.blogAuthor.create({ data });
  try {
    revalidatePath(`/blog/author/${row.slug}`);
  } catch {}
  return row;
}

export async function deleteAuthor(id: string) {
  await prisma.blogAuthor.delete({ where: { id } });
}

export async function getCategoryBySlug(slug: string) {
  return prisma.blogCategory.findUnique({ where: { slug } });
}

export async function getTagBySlug(slug: string) {
  return prisma.blogTag.findUnique({ where: { slug } });
}

/** Lookup data for the editor's selects. */
export async function editorOptions() {
  const [authors, categories, tags, cities] = await Promise.all([
    prisma.blogAuthor.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, bio: true, credentials: true, sameAs: true } }),
    prisma.blogCategory.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.blogTag.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.city.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true, slug: true, areas: { orderBy: { name: "asc" }, select: { id: true, name: true, slug: true } } },
    }),
  ]);
  return { authors, categories, tags, cities };
}

export type EditorOptions = Awaited<ReturnType<typeof editorOptions>>;

/** Linked PGs for "PGs mentioned": explicit picks first, then PGs in the target area/city. */
export async function postProperties(post: PostWithRelations, limit = 4) {
  const cardSelect = { slug: true, name: true, minRent: true, availableBeds: true, area: { select: { name: true } }, city: { select: { name: true } }, photos: { orderBy: { sortOrder: "asc" as const }, take: 1, select: { url: true, alt: true } } } satisfies Prisma.PropertySelect;
  const picked = post.relatedPropertyIds.length
    ? await prisma.property.findMany({ where: { id: { in: post.relatedPropertyIds }, status: "PUBLISHED" }, select: cardSelect })
    : [];
  if (picked.length >= limit || (!post.targetAreaId && !post.targetCityId)) return picked.slice(0, limit);
  const nearby = await prisma.property.findMany({
    where: {
      status: "PUBLISHED",
      slug: { notIn: picked.map((p) => p.slug) },
      ...(post.targetAreaId ? { areaId: post.targetAreaId } : { cityId: post.targetCityId! }),
    },
    orderBy: [{ featured: "desc" }, { availabilityConfirmedAt: "desc" }],
    take: limit - picked.length,
    select: cardSelect,
  });
  return [...picked, ...nearby];
}

export async function searchPropertiesForEmbed(q: string) {
  const term = q.trim();
  return prisma.property.findMany({
    where: {
      status: "PUBLISHED",
      ...(term ? propertyTextWhere(term, []) : {}),
    },
    take: 10,
    orderBy: [{ featured: "desc" }, { name: "asc" }],
    select: { id: true, slug: true, name: true, minRent: true, area: { select: { name: true } }, city: { select: { name: true } } },
  });
}

export function wordsIn(value: string | null | undefined) {
  return countWords(value ?? "");
}
