import { prisma } from "@/lib/prisma";
import { requireAdminPage } from "@/lib/session";
import { listAuthors } from "@/modules/blog";
import { AuthorManager } from "@/components/admin/blog/author-manager";

export const dynamic = "force-dynamic";

export default async function BlogAuthorsPage() {
  await requireAdminPage("/admin/blog/authors");
  const [authors, admins] = await Promise.all([
    listAuthors(),
    prisma.user.findMany({ where: { role: "ADMIN" }, select: { id: true, name: true, phone: true }, orderBy: { createdAt: "asc" } }),
  ]);
  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold">Authors</h1>
      <p className="mb-5 text-sm text-muted-foreground">
        Author pages and bylines carry Person schema. Complete profiles help posts show experience and expertise (E-E-A-T).
      </p>
      <AuthorManager authors={authors} admins={admins.map((u) => ({ id: u.id, label: u.name ? `${u.name} (${u.phone})` : u.phone }))} />
    </div>
  );
}
