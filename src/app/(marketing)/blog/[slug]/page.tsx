import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { ChevronRight } from "lucide-react";
import { getCurrentUser } from "@/lib/session";
import { isPrelaunchForViewer } from "@/lib/launch-server";
import { siteUrl } from "@/lib/site";
import { formatInr } from "@/lib/format";
import { getPublishedPost, postDescription, postProperties, postToc, relatedPosts, toFields, type PostWithRelations } from "@/modules/blog";
import { articleJsonLd, breadcrumbJsonLd, faqJsonLd, howToJsonLd } from "@/modules/blog/jsonld";
import { renderPostContent } from "@/modules/blog/render";
import { JsonLd } from "@/components/blog/json-ld";
import { PostCard, formatPostDate } from "@/components/blog/post-card";

export const dynamic = "force-dynamic";

type Params = Promise<{ slug: string }>;

/** Admins can open drafts at their real URL; everyone else only sees published posts. */
const loadPost = cache(async (slug: string) => {
  const published = await getPublishedPost(slug);
  if (published) return { post: published, preview: false };
  const user = await getCurrentUser({ soft: true });
  if (user?.role !== "ADMIN") return null;
  const draft = await getPublishedPost(slug, { preview: true });
  return draft ? { post: draft, preview: true } : null;
});

function postUrl(post: PostWithRelations) {
  return `${siteUrl()}/blog/${post.slug}`;
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const loaded = await loadPost((await params).slug);
  if (!loaded) return { robots: { index: false } };
  const { post, preview } = loaded;
  const title = post.seoTitle || post.title;
  const description = postDescription(post);
  const image = post.ogImageUrl || post.coverImageUrl;
  const canonical = post.canonicalUrl || `/blog/${post.slug}`;
  const keywords = [post.focusKeyword, ...post.secondaryKeywords, ...post.tags.map((t) => t.tag.name)].filter(Boolean) as string[];
  return {
    title,
    description,
    keywords,
    authors: post.author ? [{ name: post.author.name, url: `/blog/author/${post.author.slug}` }] : undefined,
    category: post.category?.name,
    alternates: {
      canonical,
      types: { "text/markdown": `/blog/md/${post.slug}`, "application/rss+xml": "/blog/feed.xml" },
    },
    robots: preview || post.noindex ? { index: false, follow: !post.nofollow } : { index: true, follow: !post.nofollow, "max-image-preview": "large", "max-snippet": -1 },
    openGraph: {
      type: "article",
      title: post.ogTitle || title,
      description: post.ogDescription || description,
      url: `/blog/${post.slug}`,
      siteName: "pgDoor",
      locale: "en_IN",
      images: image ? [{ url: image, alt: post.coverAlt || post.title }] : undefined,
      publishedTime: post.publishedAt?.toISOString(),
      modifiedTime: post.updatedAt.toISOString(),
      authors: post.author ? [`${siteUrl()}/blog/author/${post.author.slug}`] : undefined,
      section: post.category?.name,
      tags: post.tags.map((t) => t.tag.name),
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title: post.twitterTitle || post.ogTitle || title,
      description: post.twitterDescription || post.ogDescription || description,
      images: image ? [image] : undefined,
    },
  };
}

export default async function BlogPostPage({ params }: { params: Params }) {
  const loaded = await loadPost((await params).slug);
  if (!loaded) notFound();
  const { post, preview } = loaded;
  const fields = toFields(post);
  const base = siteUrl();
  const url = postUrl(post);
  const toc = postToc(post);
  const [linkable, related, pgs] = await Promise.all([
    isPrelaunchForViewer().then((p) => !p),
    relatedPosts(post),
    postProperties(post),
  ]);
  const description = postDescription(post);
  const faqs = fields.faqs.filter((f) => f.q && f.a);
  const keyTakeaways = fields.keyTakeaways.filter(Boolean);
  const crumbs = [
    { name: "Home", url: base },
    { name: "Guides", url: `${base}/blog` },
    ...(post.category ? [{ name: post.category.name, url: `${base}/blog/category/${post.category.slug}` }] : []),
    { name: post.title, url },
  ];
  const updatedLater = post.publishedAt && post.updatedAt.getTime() - post.publishedAt.getTime() > 86_400_000;

  return (
    <article className="container-pg py-8 md:py-12">
      <JsonLd
        data={articleJsonLd(
          {
            url,
            title: post.seoTitle || post.title,
            description,
            image: post.ogImageUrl || post.coverImageUrl,
            imageAlt: post.coverAlt,
            publishedAt: post.publishedAt,
            updatedAt: post.updatedAt,
            author: post.author,
            reviewer: post.reviewer,
            category: post.category?.name,
            tags: post.tags.map((t) => t.tag.name),
            keywords: [post.focusKeyword ?? "", ...post.secondaryKeywords],
            wordCount: post.wordCount,
            schemaType: post.schemaType,
            speakable: post.speakable,
            entities: fields.entities,
            citations: fields.citations,
            targetPlace: post.targetArea
              ? { name: post.targetArea.name, city: post.targetCity?.name }
              : post.targetCity
                ? { name: post.targetCity.name }
                : null,
            lastReviewed: post.lastFactCheckedAt,
          },
          base,
        )}
      />
      <JsonLd data={breadcrumbJsonLd(crumbs)} />
      <JsonLd data={faqJsonLd(faqs, url)} />
      {post.schemaType === "HOW_TO" ? (
        <JsonLd data={howToJsonLd({ title: post.title, description, image: post.coverImageUrl, steps: fields.howToSteps, totalMinutes: post.readingMinutes }, url)} />
      ) : null}

      {preview ? (
        <p className="mb-6 rounded-[14px] bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
          Draft preview — only admins can see this page. It isn&apos;t indexed.{" "}
          <Link href={`/admin/blog/${post.id}`} className="underline">
            Back to editor
          </Link>
        </p>
      ) : null}

      <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
        {crumbs.slice(0, -1).map((c) => (
          <span key={c.url} className="flex items-center gap-1">
            <Link href={c.url.replace(base, "") || "/"} className="hover:text-ink">
              {c.name}
            </Link>
            <ChevronRight className="h-3.5 w-3.5" aria-hidden />
          </span>
        ))}
        <span className="line-clamp-1 text-ink" aria-current="page">
          {post.title}
        </span>
      </nav>

      <header className="mt-5 max-w-3xl">
        <h1 className="text-3xl font-bold leading-tight text-ink md:text-[2.6rem]">{post.title}</h1>
        {post.subtitle ? <p className="mt-3 text-lg text-muted-foreground">{post.subtitle}</p> : null}
        <div className="mt-5 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          {post.author ? (
            <Link href={`/blog/author/${post.author.slug}`} className="flex items-center gap-2 font-medium text-ink hover:text-primary" rel="author">
              {post.author.avatarUrl ? (
                // Author photo from an arbitrary URL.
                // eslint-disable-next-line @next/next/no-img-element
                <img src={post.author.avatarUrl} alt="" className="h-9 w-9 rounded-full object-cover" />
              ) : (
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-soft font-bold text-primary">{post.author.name[0]}</span>
              )}
              {post.author.name}
            </Link>
          ) : null}
          {post.reviewer ? (
            <span>
              Reviewed by{" "}
              <Link href={`/blog/author/${post.reviewer.slug}`} className="font-medium text-ink hover:text-primary">
                {post.reviewer.name}
              </Link>
            </span>
          ) : null}
          {post.publishedAt ? (
            <span>
              Published <time dateTime={post.publishedAt.toISOString()}>{formatPostDate(post.publishedAt)}</time>
            </span>
          ) : null}
          {updatedLater ? (
            <span>
              Updated <time dateTime={post.updatedAt.toISOString()}>{formatPostDate(post.updatedAt)}</time>
            </span>
          ) : null}
          {post.readingMinutes ? <span>{post.readingMinutes} min read</span> : null}
        </div>
      </header>

      {post.coverImageUrl ? (
        <figure className="mt-8 overflow-hidden rounded-[24px] bg-canvas">
          {/* Cover images are uploaded at arbitrary sizes. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={post.coverImageUrl} alt={post.coverAlt ?? ""} className="max-h-[480px] w-full object-cover" fetchPriority="high" />
        </figure>
      ) : null}

      <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_260px]">
        <div className="min-w-0 max-w-3xl">
          {post.tldr ? (
            <section aria-label="Summary" className="post-tldr rounded-[20px] border-l-4 border-primary bg-primary-soft px-5 py-4">
              <p className="text-xs font-bold uppercase tracking-wide text-primary">Quick answer</p>
              <p className="mt-1 leading-7 text-ink">{post.tldr}</p>
            </section>
          ) : null}
          {keyTakeaways.length ? (
            <section aria-labelledby="takeaways" className="post-takeaways mt-6 rounded-[20px] bg-white p-5 shadow-card">
              <h2 id="takeaways" className="font-semibold text-ink">
                Key takeaways
              </h2>
              <ul className="mt-2 list-disc space-y-1.5 pl-5 text-ink/85">
                {keyTakeaways.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            </section>
          ) : null}

          {toc.length > 2 ? (
            <details className="mt-6 rounded-[20px] bg-white p-5 shadow-card lg:hidden">
              <summary className="cursor-pointer font-semibold text-ink">In this guide</summary>
              <TocList toc={toc} />
            </details>
          ) : null}

          <div className="blog-prose mt-8">{renderPostContent(fields.contentJson, { linkable })}</div>

          {fields.statistics.length ? (
            <section aria-labelledby="figures" className="mt-12">
              <h2 id="figures" className="text-xl font-bold text-ink">
                Key figures
              </h2>
              <dl className="mt-4 grid gap-3 sm:grid-cols-2">
                {fields.statistics.map((s) => (
                  <div key={s.claim} className="rounded-[18px] bg-white p-4 shadow-card">
                    <dt className="text-sm text-muted-foreground">{s.claim}</dt>
                    <dd className="mt-1 text-xl font-bold text-ink">{s.value}</dd>
                    {s.sourceUrl ? (
                      <dd className="mt-1 text-xs text-muted-foreground">
                        Source:{" "}
                        <a href={s.sourceUrl} target="_blank" rel="noopener noreferrer" className="underline">
                          {s.sourceName || new URL(s.sourceUrl).hostname}
                        </a>
                      </dd>
                    ) : null}
                  </div>
                ))}
              </dl>
            </section>
          ) : null}

          {faqs.length ? (
            <section aria-labelledby="faq" className="mt-12">
              <h2 id="faq" className="text-xl font-bold text-ink">
                Frequently asked questions
              </h2>
              <div className="mt-4 divide-y divide-border rounded-[20px] bg-white shadow-card">
                {faqs.map((f, i) => (
                  <details key={f.q} className="group px-5 py-4" open={i === 0}>
                    <summary className="cursor-pointer list-none font-semibold text-ink marker:hidden">
                      <span className="flex items-start justify-between gap-3">
                        {f.q}
                        <span className="text-muted-foreground transition group-open:rotate-45" aria-hidden>
                          +
                        </span>
                      </span>
                    </summary>
                    <p className="mt-2 leading-7 text-ink/85">{f.a}</p>
                  </details>
                ))}
              </div>
            </section>
          ) : null}

          {fields.citations.length ? (
            <section aria-labelledby="sources" className="mt-12">
              <h2 id="sources" className="text-xl font-bold text-ink">
                Sources
              </h2>
              <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-sm text-ink/85">
                {fields.citations.map((c) => (
                  <li key={c.url}>
                    <a href={c.url} target="_blank" rel="noopener noreferrer" className="font-medium text-primary hover:underline">
                      {c.title}
                    </a>
                    {c.publisher ? ` — ${c.publisher}` : ""}
                    {c.accessedAt ? `, accessed ${c.accessedAt}` : ""}
                  </li>
                ))}
              </ol>
              {post.lastFactCheckedAt ? (
                <p className="mt-3 text-xs text-muted-foreground">Facts checked on {formatPostDate(post.lastFactCheckedAt)}.</p>
              ) : null}
            </section>
          ) : null}

          {post.tags.length ? (
            <div className="mt-10 flex flex-wrap gap-2">
              {post.tags.map(({ tag }) => (
                <Link key={tag.id} href={`/blog/tag/${tag.slug}`} className="rounded-full bg-white px-3 py-1 text-sm ring-1 ring-border hover:bg-primary-soft">
                  #{tag.name}
                </Link>
              ))}
            </div>
          ) : null}

          {post.author ? (
            <section aria-label="About the author" className="mt-12 flex gap-4 rounded-[20px] bg-white p-5 shadow-card">
              {post.author.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={post.author.avatarUrl} alt={post.author.name} className="h-16 w-16 shrink-0 rounded-full object-cover" />
              ) : (
                <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary-soft text-xl font-bold text-primary">{post.author.name[0]}</span>
              )}
              <div>
                <p className="font-semibold text-ink">
                  <Link href={`/blog/author/${post.author.slug}`} className="hover:text-primary">
                    {post.author.name}
                  </Link>
                </p>
                {post.author.jobTitle ? <p className="text-sm text-muted-foreground">{post.author.jobTitle}</p> : null}
                {post.author.bio ? <p className="mt-2 text-sm leading-6 text-ink/85">{post.author.bio}</p> : null}
                {post.author.credentials ? <p className="mt-1 text-xs text-muted-foreground">{post.author.credentials}</p> : null}
              </div>
            </section>
          ) : null}

          {pgs.length ? (
            <section aria-labelledby="pgs-mentioned" className="mt-12">
              <h2 id="pgs-mentioned" className="text-xl font-bold text-ink">
                {post.targetArea ? `PGs in ${post.targetArea.name}` : post.targetCity ? `PGs in ${post.targetCity.name}` : "PGs mentioned"}
              </h2>
              <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                {pgs.map((pg) => {
                  const body = (
                    <>
                      <p className="font-semibold text-ink">{pg.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {pg.area.name}, {pg.city.name} · from {formatInr(pg.minRent)}/month
                      </p>
                    </>
                  );
                  return (
                    <li key={pg.slug} className="rounded-[18px] bg-white p-4 shadow-card">
                      {linkable ? (
                        <Link href={`/pg/${pg.slug}`} className="block hover:opacity-90">
                          {body}
                        </Link>
                      ) : (
                        body
                      )}
                    </li>
                  );
                })}
              </ul>
              {linkable && post.targetCity ? (
                <Link
                  href={`/pgs/${post.targetCity.slug}${post.targetArea ? `/${post.targetArea.slug}` : ""}`}
                  className="mt-3 inline-block text-sm font-semibold text-primary hover:underline"
                >
                  See all PGs →
                </Link>
              ) : null}
            </section>
          ) : null}
        </div>

        <aside className="hidden lg:block">
          {toc.length > 2 ? (
            <nav aria-label="Table of contents" className="sticky top-24 rounded-[20px] bg-white p-5 shadow-card">
              <p className="text-sm font-semibold text-ink">In this guide</p>
              <TocList toc={toc} />
            </nav>
          ) : null}
        </aside>
      </div>

      {related.length ? (
        <section aria-labelledby="related" className="mt-16">
          <h2 id="related" className="text-2xl font-bold text-ink">
            Related guides
          </h2>
          <div className="mt-5 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((p) => (
              <PostCard key={p.id} post={p} />
            ))}
          </div>
        </section>
      ) : null}
    </article>
  );
}

function TocList({ toc }: { toc: { id: string; text: string; level: number }[] }) {
  return (
    <ol className="mt-3 space-y-1.5 text-sm">
      {toc.map((item) => (
        <li key={item.id} className={item.level === 3 ? "pl-3" : ""}>
          <a href={`#${item.id}`} className="text-muted-foreground hover:text-primary">
            {item.text}
          </a>
        </li>
      ))}
    </ol>
  );
}
