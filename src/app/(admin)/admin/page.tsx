import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function AdminHomePage() {
  await requireAdmin();
  const [users, pgs, owners, leads] = await Promise.all([
    prisma.user.count(),
    prisma.property.count(),
    prisma.ownerProfile.count(),
    prisma.lead.count(),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-bold">Admin</h1>
      <div className="mt-6 grid gap-3 sm:grid-cols-4">
        {[
          ["Users", users],
          ["PGs", pgs],
          ["Owners", owners],
          ["Leads", leads],
        ].map(([label, value]) => (
          <div key={String(label)} className="rounded-[18px] bg-white p-4 shadow-card">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="mt-1 text-2xl font-bold">{value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
