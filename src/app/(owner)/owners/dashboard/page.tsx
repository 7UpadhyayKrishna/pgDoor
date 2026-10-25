import Link from "next/link";
import { CalendarClock } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireOwnerPage } from "@/lib/session";
import { leadCounts } from "@/modules/leads";
import { confirmAvailability } from "@/modules/inventory";
import { Button } from "@/components/ui/button";
import { isPrelaunch, LAUNCH_DATE_LABEL } from "@/lib/launch";

export const dynamic = "force-dynamic";

export default async function OwnerDashboardPage() {
  const user = await requireOwnerPage("/owners/dashboard");
  if (!user.ownerProfileId) {
    return <p>Create an owner profile first.</p>;
  }
  const ownerId = user.ownerProfileId;
  const prelaunch = isPrelaunch();
  const [properties, leads, counts] = await Promise.all([
    prisma.property.findMany({ where: { ownerId } }),
    prelaunch
      ? Promise.resolve([])
      : prisma.lead.findMany({
          where: { ownerId },
          include: { property: true, seeker: true },
          orderBy: { createdAt: "desc" },
          take: 8,
        }),
    prelaunch ? Promise.resolve({ total: 0, high: 0 }) : leadCounts(ownerId),
  ]);

  const availableBeds = properties.reduce((sum, p) => sum + p.availableBeds, 0);
  const underReview = properties.filter((p) => p.status === "PENDING_REVIEW").length;
  const stale = properties.filter(
    (p) => Date.now() - p.availabilityConfirmedAt.getTime() > 3 * 24 * 60 * 60 * 1000,
  );

  const stats: [string, number][] = prelaunch
    ? [
        ["Your PGs", properties.length],
        ["Under review", underReview],
        ["Available beds", availableBeds],
      ]
    : [
        ["Active PGs", properties.length],
        ["Available beds", availableBeds],
        ["New leads", counts.total],
        ["High intent", counts.high],
      ];

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Hello, {user.name ?? "there"}</h1>
        <Button asChild>
          <Link href="/owners/register">+ Add PG</Link>
        </Button>
      </div>
      {prelaunch ? (
        <div className="mt-6 flex gap-3 rounded-[18px] bg-primary-soft p-4">
          <CalendarClock className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <div>
            <p className="font-semibold text-ink">pgDoor goes live for tenants on {LAUNCH_DATE_LABEL}.</p>
            <p className="mt-1 text-sm text-ink/70">
              Keep your rent, available beds and photos up to date so your PG is ready on day one.
              Enquiries will show up here after launch.
            </p>
          </div>
        </div>
      ) : null}
      {properties.length === 0 ? (
        <div className="mt-6 rounded-[18px] bg-white p-6 text-center shadow-card">
          <p className="font-semibold">You haven&apos;t listed a PG yet.</p>
          <p className="mt-1 text-sm text-muted-foreground">It takes about 5 minutes and it&apos;s free.</p>
          <Button asChild className="mt-4">
            <Link href="/owners/register">List your PG</Link>
          </Button>
        </div>
      ) : null}
      <div className={`mt-6 grid gap-3 sm:grid-cols-2 ${prelaunch ? "lg:grid-cols-3" : "lg:grid-cols-4"}`}>
        {stats.map(([label, value]) => (
          <div key={label} className="rounded-[18px] bg-white p-4 shadow-card">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="mt-1 text-2xl font-bold">{value}</p>
          </div>
        ))}
      </div>
      {!prelaunch && stale.length ? (
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
      {leads.length ? (
        <ul className="mt-6 space-y-3">
          {leads.map((lead) => (
            <li key={lead.id} className="rounded-[18px] bg-white p-4 text-sm shadow-card">
              <span className="font-semibold">{lead.seeker.name ?? lead.seeker.phone}</span> ·{" "}
              {lead.property.name} · {lead.intentScore}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
