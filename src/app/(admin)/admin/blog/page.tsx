import Link from "next/link";
import { requireAdminPage } from "@/lib/session";
import { formatUpdatedAt } from "@/lib/format";
import { cn } from "@/lib/utils";
import { editorOptions, listAdminPosts } from "@/modules/blog";
import { BLOG_STATUS_LABEL } from "@/modules/blog/types";
import { NewPostButton } from "@/components/admin/blog/new-post-button";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

const selectClass = "h-10 rounded-xl border border-border bg-white px-3 text-sm";

function scoreClass(value: number) {
  return value >= 80 ? "bg-green-50 text-green-700" : value >= 50 ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-700";
}

export default async function AdminBlogPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; category?: string; author?: string; q?: string }>;
}) {
  await requireAdminPage("/admin/blog");
  const params = await searchParams;
  const [rows, options] = await Promise.all([
    listAdminPosts({ status: params.status, categoryId: params.category, authorId: params.author, q: params.q }),
    editorOptions(),
  ]);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Blog posts</h1>
          <p className="text-sm text-muted-foreground">Scores combine SEO (50%), AEO (25%) and GEO (25%).</p>
        </div>
        <NewPostButton />
      </div>

      <form className="mt-5 flex flex-wrap gap-2">
        <input name="q" defaultValue={params.q} placeholder="Search title or keyword" className="h-10 min-w-56 rounded-xl border border-border bg-white px-3 text-sm" />
        <select name="status" defaultValue={params.status ?? ""} className={selectClass}>
          <option value="">All statuses</option>
          {Object.entries(BLOG_STATUS_LABEL).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <select name="category" defaultValue={params.category ?? ""} className={selectClass}>
          <option value="">All categories</option>
          {options.categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <select name="author" defaultValue={params.author ?? ""} className={selectClass}>
          <option value="">All authors</option>
          {options.authors.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
        <Button type="submit" variant="outline">
          Filter
        </Button>
      </form>

      {rows.length === 0 ? (
        <div className="mt-6 rounded-[18px] bg-white px-6 py-10 text-center shadow-card">
          <p className="font-semibold text-ink">No posts yet</p>
          <p className="mt-1 text-sm text-muted-foreground">Write your first guide. The score panel will walk you through SEO, AEO and GEO.</p>
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-[18px] bg-white shadow-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Author</th>
                <th className="px-4 py-3">Updated</th>
                <th className="px-4 py-3">Score</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {rows.map(({ post, score }) => (
                <tr key={post.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3">
                    <Link href={`/admin/blog/${post.id}`} className="font-semibold text-ink hover:text-primary">
                      {post.title}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      /blog/{post.slug}
                      {post.focusKeyword ? ` · “${post.focusKeyword}”` : ""}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-xs font-semibold",
                        post.status === "PUBLISHED" ? "bg-green-50 text-green-700" : post.status === "ARCHIVED" ? "bg-slate-100 text-slate-600" : "bg-amber-50 text-amber-700",
                      )}
                    >
                      {BLOG_STATUS_LABEL[post.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{post.author?.name ?? "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{formatUpdatedAt(post.updatedAt)}</td>
                  <td className="px-4 py-3">
                    <span className={cn("rounded-full px-2 py-0.5 text-xs font-bold tabular-nums", scoreClass(score.total))} title={`SEO ${score.seo} · AEO ${score.aeo} · GEO ${score.geo}`}>
                      {score.total}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <a href={`/blog/${post.slug}`} target="_blank" rel="noreferrer" className="text-sm font-medium text-primary hover:underline">
                      {post.status === "PUBLISHED" ? "View" : "Preview"}
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
