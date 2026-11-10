import { handleRouteError, jsonError, jsonOk } from "@/lib/http";
import { requireAdmin } from "@/lib/session";
import { authorSchema, deleteAuthor, deleteTaxonomy, saveAuthor, saveTaxonomy, taxonomySchema } from "@/modules/blog";

type Context = { params: Promise<{ taxonomy: string; id: string }> };

function kindOf(taxonomy: string) {
  if (taxonomy === "categories") return "category" as const;
  if (taxonomy === "tags") return "tag" as const;
  if (taxonomy === "authors") return "author" as const;
  return null;
}

export async function PATCH(request: Request, context: Context) {
  try {
    await requireAdmin();
    const { taxonomy, id } = await context.params;
    const kind = kindOf(taxonomy);
    if (!kind) return jsonError("Not found", 404);
    const body = await request.json();
    const item =
      kind === "author" ? await saveAuthor(authorSchema.parse(body), id) : await saveTaxonomy(kind, taxonomySchema.parse(body), id);
    return jsonOk({ item });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(_request: Request, context: Context) {
  try {
    await requireAdmin();
    const { taxonomy, id } = await context.params;
    const kind = kindOf(taxonomy);
    if (!kind) return jsonError("Not found", 404);
    if (kind === "author") await deleteAuthor(id);
    else await deleteTaxonomy(kind, id);
    return jsonOk({ ok: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
