import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireOwner } from "@/lib/session";
import { leadCounts } from "@/modules/leads";
import { confirmAvailability } from "@/modules/inventory";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function OwnerDashboardPage() {
  const user = await requireOwner();
  if (!user.ownerProfileId) {
    return <p>Create an owner profile first.</p>;
  }
  const ownerId = user.ownerProfileId;
  const [properties, leads, counts] = await Promise.all([
    prisma.property.findMany({ where: { ownerId } }),
    prisma.lead.findMany({
      where: { ownerId },
      include: { property: true, seeker: true },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
    leadCounts(ownerId),
  ]);

  const availableBeds = properties.reduce((sum, p) => sum + p.availableBeds, 0);
  const stale = properties.filter(
    (p) => Date.now() - p.availabilityConfirmedAt.getTime() > 3 * 24 * 60 * 60 * 1000,
  );

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Good morning, {user.name ?? "there"}</h1>
        <Button asChild>
          <Link href="/owners/register">+ Add PG</Link>
        </Button>
      </div>
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Active PGs", properties.length],
          ["Available beds", availableBeds],
          ["New leads", counts.total],
          ["High intent", counts.high],
        ].map(([label, value]) => (
          <div key={String(label)} className="rounded-[18px] bg-white p-4 shadow-card">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="mt-1 text-2xl font-bold">{value}</p>
          </div>
        ))}
      </div>
      {stale.length ? (
        <div className="mt-6 rounded-[18px] bg-primary-soft p-4">
          <p className="font-semibold">Your PG availability hasn&apos;t been updated in 3 days.</p>
          <form
            className="mt-3"
            action={async () => {
              "use server";
              await confirmAvailability(stale[0].id);
            }}
          >
            <Button type="submit">Update availability</Button>
          </form>
        </div>
      ) : null}
      <ul className="mt-6 space-y-3">
        {leads.map((lead) => (
          <li key={lead.id} className="rounded-[18px] bg-white p-4 text-sm shadow-card">
            <span className="font-semibold">{lead.seeker.name ?? lead.seeker.phone}</span> ·{" "}
            {lead.property.name} · {lead.intentScore}
          </li>
        ))}
      </ul>
    </div>
  );
}
