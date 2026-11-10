import { requireAdminPage } from "@/lib/session";
import { listTaxonomy } from "@/modules/blog";
import { TaxonomyManager } from "@/components/admin/blog/taxonomy-manager";

export const dynamic = "force-dynamic";

export default async function BlogTagsPage() {
  await requireAdminPage("/admin/blog/tags");
  const items = await listTaxonomy("tag");
  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold">Tags</h1>
      <p className="mb-5 text-sm text-muted-foreground">
        Tags drive related posts. Tag pages with fewer than 2 posts are marked noindex so they don&apos;t look thin to Google.
      </p>
      <TaxonomyManager kind="tags" items={items} />
    </div>
  );
}
