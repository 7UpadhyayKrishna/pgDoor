import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { siteUrl } from "@/lib/site";
import { getAuthorBySlug, listPublished } from "@/modules/blog";
import { personJsonLd } from "@/modules/blog/jsonld";
import { ArchivePage } from "@/components/blog/archive";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ page?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const author = await getAuthorBySlug((await params).slug);
  if (!author) return {};
  const title = `${author.name}${author.jobTitle ? `, ${author.jobTitle}` : ""}`;
  const description = author.bio?.slice(0, 160) || `Guides written by ${author.name} on pgDoor.`;
  return {
    title,
    description,
    alternates: { canonical: `/blog/author/${author.slug}` },
    openGraph: { type: "profile", title, description, url: `/blog/author/${author.slug}`, images: author.avatarUrl ? [author.avatarUrl] : undefined },
  };
}

export default async function BlogAuthorPage({ params, searchParams }: Props) {
  const [{ slug }, { page }] = await Promise.all([params, searchParams]);
  const author = await getAuthorBySlug(slug);
  if (!author) notFound();
  const result = await listPublished({ authorSlug: slug, page: Number(page) || 1 });
  return (
    <ArchivePage
      label="Author"
      title={author.name}
      description={author.bio}
      path={`/blog/author/${author.slug}`}
      posts={result.posts}
      page={result.page}
      pages={result.pages}
      extraJsonLd={personJsonLd(author, siteUrl())}
      header={
        <header className="mt-4 flex max-w-3xl flex-col gap-5 sm:flex-row sm:items-start">
          {author.avatarUrl ? (
            // Author photo from an arbitrary URL.
            // eslint-disable-next-line @next/next/no-img-element
            <img src={author.avatarUrl} alt={author.name} className="h-24 w-24 rounded-full object-cover" />
          ) : (
            <span className="flex h-24 w-24 items-center justify-center rounded-full bg-primary-soft text-3xl font-bold text-primary">{author.name[0]}</span>
          )}
          <div>
            <h1 className="text-3xl font-bold text-ink">{author.name}</h1>
            {author.jobTitle ? <p className="mt-1 text-muted-foreground">{author.jobTitle}</p> : null}
            {author.bio ? <p className="mt-3 leading-7 text-ink/85">{author.bio}</p> : null}
            {author.credentials ? <p className="mt-2 text-sm text-muted-foreground">{author.credentials}</p> : null}
            {author.expertise.length ? (
              <p className="mt-2 text-sm text-muted-foreground">Writes about: {author.expertise.join(", ")}</p>
            ) : null}
            {author.sameAs.length ? (
              <ul className="mt-3 flex flex-wrap gap-3 text-sm">
                {author.sameAs.map((href) => (
                  <li key={href}>
                    <a href={href} target="_blank" rel="me noopener noreferrer" className="font-medium text-primary hover:underline">
                      {new URL(href).hostname.replace(/^www\./, "")}
                    </a>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </header>
      }
    />
  );
}
