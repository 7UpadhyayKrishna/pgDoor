import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTagBySlug, listPublished } from "@/modules/blog";
import { ArchivePage } from "@/components/blog/archive";

export const dynamic = "force-dynamic";

/** Tag archives with fewer posts than this look thin to search engines. */
const MIN_INDEXABLE_POSTS = 2;

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ page?: string }> };

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const [{ slug }, { page }] = await Promise.all([params, searchParams]);
  const tag = await getTagBySlug(slug);
  if (!tag) return {};
  const { total } = await listPublished({ tagSlug: slug, pageSize: 1 });
  const n = Number(page) || 1;
  const title = tag.seoTitle || `${tag.name}: PG guides`;
  const description = tag.metaDescription || tag.description || `pgDoor guides tagged ${tag.name}.`;
  const url = `/blog/tag/${tag.slug}${n > 1 ? `?page=${n}` : ""}`;
  return {
    title: n > 1 ? `${title} (page ${n})` : title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url },
    robots: total < MIN_INDEXABLE_POSTS ? { index: false, follow: true } : undefined,
  };
}

export default async function BlogTagPage({ params, searchParams }: Props) {
  const [{ slug }, { page }] = await Promise.all([params, searchParams]);
  const tag = await getTagBySlug(slug);
  if (!tag) notFound();
  const result = await listPublished({ tagSlug: slug, page: Number(page) || 1 });
  return (
    <ArchivePage
      label="Topic"
      title={`#${tag.name}`}
      description={tag.description}
      path={`/blog/tag/${tag.slug}`}
      posts={result.posts}
      page={result.page}
      pages={result.pages}
    />
  );
}
