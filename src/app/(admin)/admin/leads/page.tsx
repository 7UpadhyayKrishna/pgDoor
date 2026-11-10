import { prisma } from "@/lib/prisma";
import { requireAdminPage } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function AdminLeadsPage() {
  await requireAdminPage("/admin/leads");
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
      {leads.length === 0 ? (
        <div className="mt-6 rounded-[18px] bg-white px-6 py-10 text-center shadow-card">
          <p className="font-semibold text-ink">No leads yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Enquiries and visit requests from tenants will show up here.
          </p>
        </div>
      ) : null}
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
