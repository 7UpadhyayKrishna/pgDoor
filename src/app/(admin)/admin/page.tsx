import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAdminPage } from "@/lib/session";
import { OPEN_STAGES, PROSPECT_STAGES, STAGE_LABEL } from "@/lib/crm-labels";
import { endOfIstDay } from "@/lib/ist";
import { stageCounts } from "@/modules/crm";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

function StatCard({ label, value, href, hint }: { label: string; value: number; href?: string; hint?: string }) {
  const body = (
    <>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </>
  );
  return href ? (
    <Link href={href} className="block rounded-[18px] bg-white p-4 shadow-card hover:shadow-md">
      {body}
    </Link>
  ) : (
    <div className="rounded-[18px] bg-white p-4 shadow-card">{body}</div>
  );
}

export default async function AdminHomePage() {
  await requireAdminPage("/admin");
  const [users, pgs, owners, leads, pendingReview, unverified, unusedCredentials, followUpsDue, stages] =
    await Promise.all([
      prisma.user.count(),
      prisma.property.count(),
      prisma.ownerProfile.count(),
      prisma.lead.count(),
      prisma.property.count({ where: { status: "PENDING_REVIEW" } }),
      prisma.property.count({ where: { verificationLevel: { not: "PGDOOR_VERIFIED" }, status: { not: "REJECTED" } } }),
      prisma.ownerProfile.count({
        where: { credentialIssuedAt: { not: null }, user: { lastLoginAt: null } },
      }),
      prisma.ownerProspect.count({
        where: { stage: { in: OPEN_STAGES }, nextFollowUpAt: { lte: endOfIstDay() } },
      }),
      stageCounts(),
    ]);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Admin</h1>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/admin/crm">Open CRM</Link>
          </Button>
          <Button asChild>
            <Link href="/admin/pgs/new">+ List a PG</Link>
          </Button>
        </div>
      </div>

      <section>
        <h2 className="text-sm font-semibold text-muted-foreground">Needs attention</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-4">
          <StatCard label="Awaiting review" value={pendingReview} href="/admin/pgs?status=PENDING_REVIEW" />
          <StatCard
            label="Not fully verified"
            value={unverified}
            href="/admin/pgs"
            hint="Checklist still open"
          />
          <StatCard
            label="Credentials never used"
            value={unusedCredentials}
            href="/admin/owners"
            hint="Owner hasn't logged in"
          />
          <StatCard label="Follow-ups due today" value={followUpsDue} href="/admin/crm" />
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold text-muted-foreground">Owner pipeline</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-4 lg:grid-cols-7">
          {PROSPECT_STAGES.map((stage) => (
            <StatCard key={stage} label={STAGE_LABEL[stage]} value={stages[stage]} href="/admin/crm" />
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold text-muted-foreground">Totals</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-4">
          <StatCard label="Users" value={users} href="/admin/users" />
          <StatCard label="PGs" value={pgs} href="/admin/pgs" />
          <StatCard label="Owners" value={owners} href="/admin/owners" />
          <StatCard label="Leads" value={leads} href="/admin/leads" />
        </div>
      </section>
    </div>
  );
}
