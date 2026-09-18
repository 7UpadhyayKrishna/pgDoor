import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function AdminLeadsPage() {
  await requireAdmin();
  const leads = await prisma.lead.findMany({
    include: {
      seeker: { select: { phone: true, name: true } },
      property: { select: { name: true, slug: true } },
      owner: { include: { user: { select: { phone: true } } } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div>
      <h1 className="text-2xl font-bold">Leads</h1>
      <p className="mt-1 text-sm text-muted-foreground">User → PG → Owner → outcome</p>
      <ul className="mt-6 space-y-2 text-sm">
        {leads.map((lead) => (
          <li key={lead.id} className="rounded-[16px] bg-white px-4 py-3 shadow-card">
            {lead.seeker.phone} → {lead.property.name} → {lead.owner.user.phone} · {lead.status} ·{" "}
            {lead.intentScore}
          </li>
        ))}
      </ul>
    </div>
  );
}
