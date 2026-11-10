import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { siteUrl } from "@/lib/site";
import { listPublished } from "@/modules/blog";
import { collectionJsonLd } from "@/modules/blog/jsonld";
import { JsonLd } from "@/components/blog/json-ld";
import { PostCard } from "@/components/blog/post-card";
import { EmptyPosts, Pagination, PostGrid } from "@/components/blog/post-list";

export const dynamic = "force-dynamic";

const TITLE = "PG guides for Gurgaon and Delhi NCR";
const DESCRIPTION =
  "Practical guides on finding a PG in Gurgaon and NCR: rent by area, commute costs, deposits, house rules and how to avoid scams.";

type Search = Promise<{ page?: string }>;

export async function generateMetadata({ searchParams }: { searchParams: Search }): Promise<Metadata> {
  const page = Number((await searchParams).page) || 1;
  const url = page > 1 ? `/blog?page=${page}` : "/blog";
  return {
    title: page > 1 ? `${TITLE} (page ${page})` : TITLE,
    description: DESCRIPTION,
    alternates: {
      canonical: url,
      types: { "application/rss+xml": "/blog/feed.xml", "application/feed+json": "/blog/feed.json" },
    },
    openGraph: { title: TITLE, description: DESCRIPTION, url, type: "website" },
  };
}

export default async function BlogIndexPage({ searchParams }: { searchParams: Search }) {
  const page = Math.max(1, Number((await searchParams).page) || 1);
  const [{ posts, pages }, categories] = await Promise.all([
    listPublished({ page }),
    prisma.blogCategory.findMany({
      where: { posts: { some: { status: "PUBLISHED" } } },
      orderBy: { name: "asc" },
      select: { slug: true, name: true },
    }),
  ]);
  const [featured, ...rest] = page === 1 ? posts : [undefined, ...posts];
  const base = siteUrl();

  return (
    <div className="container-pg py-10 md:py-14">
      <JsonLd
        data={collectionJsonLd({
          name: TITLE,
          description: DESCRIPTION,
          url: `${base}/blog`,
          posts: posts.map((p) => ({ title: p.title, url: `${base}/blog/${p.slug}` })),
        })}
      />
      <header className="max-w-2xl">
        <h1 className="text-3xl font-bold text-ink md:text-4xl">PG guides</h1>
        <p className="mt-2 text-muted-foreground">{DESCRIPTION}</p>
      </header>
      {categories.length ? (
        <nav aria-label="Categories" className="mt-6 flex flex-wrap gap-2">
          {categories.map((c) => (
            <Link key={c.slug} href={`/blog/category/${c.slug}`} className="inline-flex min-h-10 items-center rounded-full bg-white px-4 text-sm font-medium ring-1 ring-border hover:bg-primary-soft">
              {c.name}
            </Link>
          ))}
        </nav>
      ) : null}

      <div className="mt-8 space-y-10">
        {posts.length === 0 ? (
          <EmptyPosts text="We're writing our first guides. Check back soon." />
        ) : (
          <>
            {featured ? <PostCard post={featured} featured /> : null}
            {rest.length ? <PostGrid posts={rest.filter((p): p is NonNullable<typeof p> => Boolean(p))} /> : null}
          </>
        )}
      </div>
      <Pagination page={page} pages={pages} basePath="/blog" />
    </div>
  );
}
