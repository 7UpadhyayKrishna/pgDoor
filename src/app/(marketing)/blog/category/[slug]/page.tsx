import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCategoryBySlug, listPublished } from "@/modules/blog";
import { ArchivePage } from "@/components/blog/archive";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ page?: string }> };

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const [{ slug }, { page }] = await Promise.all([params, searchParams]);
  const category = await getCategoryBySlug(slug);
  if (!category) return {};
  const n = Number(page) || 1;
  const title = category.seoTitle || `${category.name}: PG guides`;
  const description = category.metaDescription || category.description || `Guides about ${category.name.toLowerCase()} for PG tenants in Gurgaon and NCR.`;
  const url = `/blog/category/${category.slug}${n > 1 ? `?page=${n}` : ""}`;
  return { title: n > 1 ? `${title} (page ${n})` : title, description, alternates: { canonical: url }, openGraph: { title, description, url } };
}

export default async function BlogCategoryPage({ params, searchParams }: Props) {
  const [{ slug }, { page }] = await Promise.all([params, searchParams]);
  const category = await getCategoryBySlug(slug);
  if (!category) notFound();
  const result = await listPublished({ categorySlug: slug, page: Number(page) || 1 });
  return (
    <ArchivePage
      label="Category"
      title={category.name}
      description={category.description}
      path={`/blog/category/${category.slug}`}
      posts={result.posts}
      page={result.page}
      pages={result.pages}
    />
  );
}
