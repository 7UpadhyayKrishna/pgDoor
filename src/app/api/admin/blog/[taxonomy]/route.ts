import { handleRouteError, jsonError, jsonOk } from "@/lib/http";
import { requireAdmin } from "@/lib/session";
import { authorSchema, listAuthors, listTaxonomy, saveAuthor, saveTaxonomy, taxonomySchema } from "@/modules/blog";

type Context = { params: Promise<{ taxonomy: string }> };

function kindOf(taxonomy: string) {
  if (taxonomy === "categories") return "category" as const;
  if (taxonomy === "tags") return "tag" as const;
  if (taxonomy === "authors") return "author" as const;
  return null;
}

export async function GET(_request: Request, context: Context) {
  try {
    await requireAdmin();
    const kind = kindOf((await context.params).taxonomy);
    if (!kind) return jsonError("Not found", 404);
    const items = kind === "author" ? await listAuthors() : await listTaxonomy(kind);
    return jsonOk({ items });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request, context: Context) {
  try {
    await requireAdmin();
    const kind = kindOf((await context.params).taxonomy);
    if (!kind) return jsonError("Not found", 404);
    const body = await request.json();
    const item = kind === "author" ? await saveAuthor(authorSchema.parse(body)) : await saveTaxonomy(kind, taxonomySchema.parse(body));
    return jsonOk({ item }, 201);
  } catch (error) {
    return handleRouteError(error);
  }
}
