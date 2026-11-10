import Link from "next/link";
import type { ProspectSource, ProspectStage } from "@prisma/client";
import { CalendarClock, Phone } from "lucide-react";
import { requireAdminPage } from "@/lib/session";
import { PROSPECT_STAGES, SOURCE_LABEL, STAGE_LABEL } from "@/lib/crm-labels";
import { formatIst, startOfIstDay } from "@/lib/ist";
import { cn } from "@/lib/utils";
import { listCities } from "@/modules/locations";
import { followUpsDue, listAdmins, listProspects, type ProspectFilters } from "@/modules/crm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AddProspectDialog } from "@/components/admin/prospect-form";

export const dynamic = "force-dynamic";

const selectClass = "h-10 rounded-xl border border-border bg-white px-3 text-sm";

export default async function AdminCrmPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; assignee?: string; source?: string; stage?: string }>;
}) {
  const admin = await requireAdminPage("/admin/crm");
  const params = await searchParams;
  const filters: ProspectFilters = {
    q: params.q,
    assignedToId: params.assignee === "me" ? admin.id : params.assignee || undefined,
    source: params.source && params.source in SOURCE_LABEL ? (params.source as ProspectSource) : undefined,
  };
  const [prospects, due, admins, cities] = await Promise.all([
    listProspects(filters),
    followUpsDue(filters),
    listAdmins(),
    listCities(),
  ]);
  const byStage = new Map<ProspectStage, typeof prospects>(PROSPECT_STAGES.map((s) => [s, []]));
  for (const p of prospects) byStage.get(p.stage)?.push(p);
  const today = startOfIstDay();

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Owner CRM</h1>
          <p className="text-sm text-muted-foreground">PG owners we are bringing onto pgDoor</p>
        </div>
        <AddProspectDialog
          cities={cities.map((c) => ({ id: c.id, name: c.name, areas: c.areas.map((a) => ({ id: a.id, name: a.name })) }))}
          admins={admins}
          defaultAssigneeId={admin.id}
        />
      </div>

      <form className="mt-4 flex flex-wrap gap-2">
        <Input name="q" defaultValue={params.q} placeholder="Search name, PG or phone" className="max-w-xs" />
        <select name="assignee" defaultValue={params.assignee ?? ""} className={selectClass}>
          <option value="">Everyone</option>
          <option value="me">Assigned to me</option>
          {admins.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name ?? a.phone}
            </option>
          ))}
        </select>
        <select name="source" defaultValue={params.source ?? ""} className={selectClass}>
          <option value="">All sources</option>
          {(Object.keys(SOURCE_LABEL) as ProspectSource[]).map((s) => (
            <option key={s} value={s}>
              {SOURCE_LABEL[s]}
            </option>
          ))}
        </select>
        <Button type="submit" variant="outline">
          Filter
        </Button>
        {params.q || params.assignee || params.source ? (
          <Button asChild variant="ghost">
            <Link href="/admin/crm">Clear</Link>
          </Button>
        ) : null}
      </form>

      <section className="mt-5 rounded-[18px] bg-white p-4 shadow-card">
        <h2 className="flex items-center gap-2 font-semibold">
          <CalendarClock className="h-4 w-4" />
          Follow-ups due today ({due.length})
        </h2>
        {due.length ? (
          <ul className="mt-3 divide-y divide-border">
            {due.map((p) => {
              const overdue = p.nextFollowUpAt && p.nextFollowUpAt < today;
              return (
                <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
                  <Link href={`/admin/crm/${p.id}`} className="font-medium hover:underline">
                    {p.name}
                    {p.pgName ? <span className="font-normal text-muted-foreground"> · {p.pgName}</span> : null}
                  </Link>
                  <span className="flex items-center gap-3">
                    <span className={cn("text-xs", overdue ? "font-semibold text-red-600" : "text-muted-foreground")}>
                      {overdue ? "Overdue · " : ""}
                      {p.nextFollowUpAt ? formatIst(p.nextFollowUpAt) : ""}
                    </span>
                    <a href={`tel:${p.phone}`} className="inline-flex items-center gap-1 text-xs text-primary">
                      <Phone className="h-3.5 w-3.5" />
                      {p.phone}
                    </a>
                  </span>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-muted-foreground">Nothing due. Nice.</p>
        )}
      </section>

      <div className="mt-5 flex gap-3 overflow-x-auto pb-4">
        {PROSPECT_STAGES.map((stage) => {
          const items = byStage.get(stage) ?? [];
          return (
            <section key={stage} className="w-64 shrink-0 rounded-[18px] bg-white/60 p-2">
              <h3 className="flex items-center justify-between px-2 py-1 text-sm font-semibold">
                {STAGE_LABEL[stage]}
                <span className="rounded-full bg-white px-2 text-xs text-muted-foreground">{items.length}</span>
              </h3>
              <ul className="mt-1 space-y-2">
                {items.map((p) => {
                  const overdue = p.nextFollowUpAt && p.nextFollowUpAt < today;
                  return (
                    <li key={p.id}>
                      <Link
                        href={`/admin/crm/${p.id}`}
                        className="block rounded-[14px] bg-white p-3 text-sm shadow-card hover:shadow-md"
                      >
                        <p className="font-medium">{p.name}</p>
                        {p.pgName ? <p className="text-xs text-muted-foreground">{p.pgName}</p> : null}
                        <p className="mt-1 text-xs text-muted-foreground">
                          {[p.area?.name, p.city?.name].filter(Boolean).join(", ") || p.phone}
                          {p.approxBeds ? ` · ~${p.approxBeds} beds` : ""}
                        </p>
                        <div className="mt-2 flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">
                            {p.assignedTo ? (p.assignedTo.name ?? p.assignedTo.phone) : "Unassigned"}
                          </span>
                          {p.nextFollowUpAt ? (
                            <span className={cn(overdue ? "font-semibold text-red-600" : "text-muted-foreground")}>
                              {formatIst(p.nextFollowUpAt, "date")}
                            </span>
                          ) : null}
                        </div>
                      </Link>
                    </li>
                  );
                })}
                {items.length === 0 ? <li className="px-2 py-3 text-xs text-muted-foreground">Empty</li> : null}
              </ul>
            </section>
          );
        })}
      </div>
    </div>
  );
}
