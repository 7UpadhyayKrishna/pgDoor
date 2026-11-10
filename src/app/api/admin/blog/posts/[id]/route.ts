import { handleRouteError, jsonOk } from "@/lib/http";
import { requireAdmin } from "@/lib/session";
import { deletePost, getAdminPost, postPatchSchema, postScore, toFields, updatePost } from "@/modules/blog";

type Context = { params: Promise<{ id: string }> };

function payload(post: Awaited<ReturnType<typeof getAdminPost>>) {
  return {
    id: post.id,
    status: post.status,
    publishedAt: post.publishedAt,
    updatedAt: post.updatedAt,
    fields: toFields(post),
    score: postScore(post),
  };
}

export async function GET(_request: Request, context: Context) {
  try {
    await requireAdmin();
    const { id } = await context.params;
    return jsonOk({ post: payload(await getAdminPost(id)) });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(request: Request, context: Context) {
  try {
    await requireAdmin();
    const { id } = await context.params;
    const patch = postPatchSchema.parse(await request.json());
    const post = await updatePost(id, patch);
    return jsonOk({ post: payload(post) });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(_request: Request, context: Context) {
  try {
    await requireAdmin();
    const { id } = await context.params;
    await deletePost(id);
    return jsonOk({ ok: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
