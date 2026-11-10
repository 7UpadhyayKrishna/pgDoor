import Link from "next/link";
import type { PostWithRelations } from "@/modules/blog";
import { PostCard } from "@/components/blog/post-card";
import { cn } from "@/lib/utils";

export function PostGrid({ posts }: { posts: PostWithRelations[] }) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  );
}

export function Pagination({ page, pages, basePath }: { page: number; pages: number; basePath: string }) {
  if (pages <= 1) return null;
  const href = (p: number) => (p <= 1 ? basePath : `${basePath}?page=${p}`);
  return (
    <nav aria-label="Pages" className="mt-10 flex items-center justify-center gap-2">
      {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
        <Link
          key={p}
          href={href(p)}
          aria-current={p === page ? "page" : undefined}
          className={cn(
            "flex h-10 min-w-10 items-center justify-center rounded-full px-3 text-sm font-medium ring-1 ring-border",
            p === page ? "bg-ink text-white ring-ink" : "bg-white hover:bg-canvas",
          )}
        >
          {p}
        </Link>
      ))}
    </nav>
  );
}

export function EmptyPosts({ text }: { text: string }) {
  return (
    <div className="rounded-[24px] bg-white px-6 py-12 text-center shadow-card">
      <p className="font-semibold text-ink">No guides here yet</p>
      <p className="mt-1 text-sm text-muted-foreground">{text}</p>
      <Link href="/blog" className="mt-4 inline-block text-sm font-semibold text-primary hover:underline">
        All guides
      </Link>
    </div>
  );
}
