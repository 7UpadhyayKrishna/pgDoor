import Link from "next/link";
import type { PostWithRelations } from "@/modules/blog";
import { postDescription } from "@/modules/blog";

export function formatPostDate(date: Date | null | undefined) {
  return date ? date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "";
}

export function PostCard({ post, featured = false }: { post: PostWithRelations; featured?: boolean }) {
  return (
    <article className={featured ? "grid gap-6 overflow-hidden rounded-[24px] bg-white shadow-card md:grid-cols-2" : "overflow-hidden rounded-[20px] bg-white shadow-card"}>
      <Link href={`/blog/${post.slug}`} className="block aspect-[16/9] bg-canvas">
        {post.coverImageUrl ? (
          // Blog covers are uploaded at arbitrary sizes.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={post.coverImageUrl} alt={post.coverAlt ?? ""} loading={featured ? "eager" : "lazy"} className="h-full w-full object-cover" />
        ) : (
          <span className="flex h-full items-center justify-center bg-gradient-to-br from-primary-soft to-canvas px-6 text-center text-lg font-semibold text-ink/70">
            {post.title}
          </span>
        )}
      </Link>
      <div className={featured ? "flex flex-col justify-center p-6 md:pl-0" : "p-5"}>
        <p className="text-xs font-semibold uppercase tracking-wide text-primary">
          {post.category ? (
            <Link href={`/blog/category/${post.category.slug}`} className="hover:underline">
              {post.category.name}
            </Link>
          ) : (
            "Guide"
          )}
        </p>
        <h2 className={featured ? "mt-2 text-2xl font-bold text-ink md:text-3xl" : "mt-1.5 text-lg font-semibold leading-snug text-ink"}>
          <Link href={`/blog/${post.slug}`} className="hover:text-primary">
            {post.title}
          </Link>
        </h2>
        <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{postDescription(post)}</p>
        <p className="mt-3 text-xs text-muted-foreground">
          {post.author ? `${post.author.name} · ` : ""}
          <time dateTime={post.publishedAt?.toISOString()}>{formatPostDate(post.publishedAt)}</time>
          {post.readingMinutes ? ` · ${post.readingMinutes} min read` : ""}
        </p>
      </div>
    </article>
  );
}
