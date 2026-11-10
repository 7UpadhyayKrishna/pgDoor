import { handleRouteError, jsonOk } from "@/lib/http";
import { requireAdmin } from "@/lib/session";
import { createPost, listAdminPosts } from "@/modules/blog";

export async function GET(request: Request) {
  try {
    await requireAdmin();
    const params = new URL(request.url).searchParams;
    const rows = await listAdminPosts({
      status: params.get("status") ?? undefined,
      categoryId: params.get("category") ?? undefined,
      authorId: params.get("author") ?? undefined,
      q: params.get("q") ?? undefined,
    });
    return jsonOk({
      posts: rows.map(({ post, score }) => ({
        id: post.id,
        title: post.title,
        slug: post.slug,
        status: post.status,
        updatedAt: post.updatedAt,
        author: post.author?.name ?? null,
        score: score.total,
      })),
    });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST() {
  try {
    const admin = await requireAdmin();
    const post = await createPost(admin.id);
    return jsonOk({ post }, 201);
  } catch (error) {
    return handleRouteError(error);
  }
}
