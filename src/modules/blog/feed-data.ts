import { docToHtml, docToMarkdown } from "@/modules/blog/content";
import type { FeedPost } from "@/modules/blog/feeds";
import { postDescription, toFields, type PostWithRelations } from "@/modules/blog";

export function toFeedPost(post: PostWithRelations, siteUrl: string): FeedPost {
  const fields = toFields(post);
  return {
    slug: post.slug,
    title: post.title,
    description: postDescription(post),
    html: docToHtml(fields.contentJson, siteUrl),
    markdown: docToMarkdown(fields.contentJson, siteUrl),
    publishedAt: post.publishedAt ?? post.createdAt,
    updatedAt: post.updatedAt,
    authorName: post.author?.name,
    category: post.category?.name,
    tags: post.tags.map((t) => t.tag.name),
    image: post.ogImageUrl || post.coverImageUrl,
    tldr: post.tldr,
    keyTakeaways: fields.keyTakeaways,
    faqs: fields.faqs.filter((f) => f.q && f.a),
    statistics: fields.statistics.filter((s) => s.claim && s.value),
    citations: fields.citations.filter((c) => c.url),
    aiSummary: post.aiSummary,
  };
}
