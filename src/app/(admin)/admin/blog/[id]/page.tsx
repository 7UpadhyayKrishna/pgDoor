import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireAdminPage } from "@/lib/session";
import { siteUrl } from "@/lib/site";
import { editorOptions, toFields } from "@/modules/blog";
import { PostEditor } from "@/components/admin/blog/post-editor";

export const dynamic = "force-dynamic";

export default async function EditBlogPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireAdminPage(`/admin/blog/${id}`);
  const post = await prisma.blogPost.findUnique({
    where: { id },
    include: {
      author: true,
      reviewer: true,
      category: true,
      tags: { include: { tag: true } },
      targetCity: { select: { id: true, name: true, slug: true } },
      targetArea: { select: { id: true, name: true, slug: true } },
    },
  });
  if (!post) notFound();
  const [lookups, linkedPgs] = await Promise.all([
    editorOptions(),
    post.relatedPropertyIds.length
      ? prisma.property.findMany({ where: { id: { in: post.relatedPropertyIds } }, select: { id: true, name: true } })
      : Promise.resolve([]),
  ]);

  return (
    <div>
      <Link href="/admin/blog" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-ink">
        <ArrowLeft className="h-4 w-4" /> All posts
      </Link>
      <PostEditor
        postId={post.id}
        siteUrl={siteUrl()}
        lookups={lookups}
        initialLinkedPgs={linkedPgs}
        initial={{
          fields: toFields(post),
          status: post.status,
          publishedAt: post.publishedAt?.toISOString() ?? null,
          updatedAt: post.updatedAt.toISOString(),
        }}
      />
    </div>
  );
}
