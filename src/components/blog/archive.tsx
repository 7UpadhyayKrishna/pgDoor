import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { siteUrl } from "@/lib/site";
import type { PostWithRelations } from "@/modules/blog";
import { breadcrumbJsonLd, collectionJsonLd } from "@/modules/blog/jsonld";
import { JsonLd } from "@/components/blog/json-ld";
import { EmptyPosts, Pagination, PostGrid } from "@/components/blog/post-list";

export function ArchivePage({
  label,
  title,
  description,
  path,
  posts,
  page,
  pages,
  extraJsonLd,
  header,
}: {
  label: string;
  title: string;
  description?: string | null;
  path: string;
  posts: PostWithRelations[];
  page: number;
  pages: number;
  extraJsonLd?: unknown;
  header?: React.ReactNode;
}) {
  const base = siteUrl();
  return (
    <div className="container-pg py-10 md:py-14">
      <JsonLd
        data={collectionJsonLd({
          name: title,
          description,
          url: `${base}${path}`,
          posts: posts.map((p) => ({ title: p.title, url: `${base}/blog/${p.slug}` })),
        })}
      />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", url: base },
          { name: "Guides", url: `${base}/blog` },
          { name: title, url: `${base}${path}` },
        ])}
      />
      {extraJsonLd ? <JsonLd data={extraJsonLd} /> : null}
      <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-sm text-muted-foreground">
        <Link href="/blog" className="hover:text-ink">
          Guides
        </Link>
        <ChevronRight className="h-3.5 w-3.5" aria-hidden />
        <span className="text-ink">{title}</span>
      </nav>
      {header ?? (
        <header className="mt-4 max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-wide text-primary">{label}</p>
          <h1 className="mt-1 text-3xl font-bold text-ink md:text-4xl">{title}</h1>
          {description ? <p className="mt-3 text-muted-foreground">{description}</p> : null}
        </header>
      )}
      <div className="mt-8">{posts.length ? <PostGrid posts={posts} /> : <EmptyPosts text="New guides are on the way." />}</div>
      <Pagination page={page} pages={pages} basePath={path} />
    </div>
  );
}
