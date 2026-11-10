import { requireAdminPage } from "@/lib/session";
import { NewPostButton } from "@/components/admin/blog/new-post-button";

export const dynamic = "force-dynamic";

export default async function NewBlogPostPage() {
  await requireAdminPage("/admin/blog/new");
  return (
    <div className="rounded-[18px] bg-white px-6 py-10 text-center shadow-card">
      <p className="font-semibold text-ink">Start a new post</p>
      <p className="mt-1 text-sm text-muted-foreground">A draft is created and saved automatically as you write.</p>
      <div className="mt-4 flex justify-center">
        <NewPostButton />
      </div>
    </div>
  );
}
