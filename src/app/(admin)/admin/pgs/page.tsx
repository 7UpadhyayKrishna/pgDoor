import Link from "next/link";
import type { PropertyStatus, VerificationLevel } from "@prisma/client";
import { requireAdminPage } from "@/lib/session";
import { VERIFICATION_LABEL } from "@/lib/constants";
import { formatUpdatedAt } from "@/lib/format";
import { cn } from "@/lib/utils";
import { checkProgress, listForAdmin } from "@/modules/verification";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const dynamic = "force-dynamic";

const STATUSES: PropertyStatus[] = ["PENDING_REVIEW", "PUBLISHED", "REJECTED", "SUSPENDED", "DRAFT"];
const LEVELS: VerificationLevel[] = ["UNVERIFIED", "OWNER_VERIFIED", "PROPERTY_VERIFIED", "PGDOOR_VERIFIED"];

const STATUS_STYLE: Record<PropertyStatus, string> = {
  PENDING_REVIEW: "bg-amber-50 text-amber-700",
  PUBLISHED: "bg-green-50 text-green-700",
  REJECTED: "bg-red-50 text-red-700",
  SUSPENDED: "bg-red-50 text-red-700",
  DRAFT: "bg-slate-100 text-slate-700",
};

const selectClass = "h-10 rounded-xl border border-border bg-white px-3 text-sm";

export default async function AdminPgsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; level?: string; q?: string; owner?: string }>;
}) {
  await requireAdminPage("/admin/pgs");
  const params = await searchParams;
  const status = STATUSES.includes(params.status as PropertyStatus) ? (params.status as PropertyStatus) : undefined;
  const level = LEVELS.includes(params.level as VerificationLevel) ? (params.level as VerificationLevel) : undefined;
  const pgs = await listForAdmin({ status, level, q: params.q, ownerId: params.owner });

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Properties</h1>
        <Button asChild>
          <Link href="/admin/pgs/new">+ List a PG</Link>
        </Button>
      </div>

      <form className="mt-4 flex flex-wrap gap-2">
        <Input name="q" defaultValue={params.q} placeholder="Search name, address or phone" className="max-w-xs" />
        <select name="status" defaultValue={status ?? ""} className={selectClass}>
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s.replace("_", " ").toLowerCase()}
            </option>
          ))}
        </select>
        <select name="level" defaultValue={level ?? ""} className={selectClass}>
          <option value="">Any verification</option>
          {LEVELS.map((l) => (
            <option key={l} value={l}>
              {VERIFICATION_LABEL[l]}
            </option>
          ))}
        </select>
        {params.owner ? <input type="hidden" name="owner" value={params.owner} /> : null}
        <Button type="submit" variant="outline">
          Filter
        </Button>
        {params.q || status || level || params.owner ? (
          <Button asChild variant="ghost">
            <Link href="/admin/pgs">Clear</Link>
          </Button>
        ) : null}
      </form>

      <p className="mt-3 text-xs text-muted-foreground">{pgs.length} PGs</p>
      <ul className="mt-2 space-y-3">
        {pgs.map((pg) => {
          const progress = checkProgress(pg.verificationChecks);
          return (
            <li key={pg.id}>
              <Link
                href={`/admin/pgs/${pg.id}`}
                className="block rounded-[18px] bg-white p-4 shadow-card transition-shadow hover:shadow-md"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold">{pg.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {pg.area.name}, {pg.city.name} · {pg.owner.user.name ?? "Owner"} {pg.owner.user.phone} · added{" "}
                      {formatUpdatedAt(pg.createdAt)}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5 text-xs font-semibold">
                    <span className={cn("rounded-full px-2.5 py-1", STATUS_STYLE[pg.status])}>
                      {pg.status.replace("_", " ").toLowerCase()}
                    </span>
                    <span className="rounded-full bg-canvas px-2.5 py-1">{VERIFICATION_LABEL[pg.verificationLevel]}</span>
                    {pg.featured ? <span className="rounded-full bg-primary/10 px-2.5 py-1 text-primary">featured</span> : null}
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-3">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-canvas">
                    <div
                      className={cn("h-full rounded-full", progress.failed ? "bg-red-500" : "bg-primary")}
                      style={{ width: `${(progress.done / progress.total) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {progress.done}/{progress.total} checks{progress.failed ? ` · ${progress.failed} failed` : ""}
                  </span>
                </div>
              </Link>
            </li>
          );
        })}
        {pgs.length === 0 ? (
          <li className="rounded-[18px] bg-white p-6 text-center text-sm text-muted-foreground shadow-card">
            No PGs match these filters.
          </li>
        ) : null}
      </ul>
    </div>
  );
}
