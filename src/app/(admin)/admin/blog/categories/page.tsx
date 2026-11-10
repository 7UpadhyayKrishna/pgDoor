import { requireAdminPage } from "@/lib/session";
import { listTaxonomy } from "@/modules/blog";
import { TaxonomyManager } from "@/components/admin/blog/taxonomy-manager";

export const dynamic = "force-dynamic";

export default async function BlogCategoriesPage() {
  await requireAdminPage("/admin/blog/categories");
  const items = await listTaxonomy("category");
  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold">Categories</h1>
      <p className="mb-5 text-sm text-muted-foreground">Each category gets its own indexable archive page with its own title and description.</p>
      <TaxonomyManager kind="categories" items={items} />
    </div>
  );
}
