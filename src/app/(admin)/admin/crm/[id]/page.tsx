import Link from "next/link";
import { notFound } from "next/navigation";
import { revalidatePath } from "next/cache";
import type { ProspectStage } from "@prisma/client";
import { ArrowLeft, Building2, MessageCircle, Phone } from "lucide-react";
import { requireAdminPage } from "@/lib/session";
import { HttpError } from "@/lib/rbac";
import { ACTIVITY_LABEL, PROSPECT_STAGES, SOURCE_LABEL, STAGE_LABEL } from "@/lib/crm-labels";
import { formatUpdatedAt } from "@/lib/format";
import { formatIst, parseIstDateTimeLocal, toIstDateTimeLocal } from "@/lib/ist";
import { cn } from "@/lib/utils";
import { listCities } from "@/modules/locations";
import {
  addActivity,
  assignProspect,
  changeStage,
  existingOwnerForPhone,
  getProspect,
  listAdmins,
  setFollowUp,
} from "@/modules/crm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ProspectForm } from "@/components/admin/prospect-form";

export const dynamic = "force-dynamic";

const LOG_TYPES = ["CALL", "WHATSAPP", "VISIT", "NOTE"] as const;
const selectClass = "h-10 rounded-xl border border-border bg-white px-3 text-sm";

export default async function ProspectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const admin = await requireAdminPage(`/admin/crm/${id}`);
  const prospect = await getProspect(id).catch((error) => {
    if (error instanceof HttpError && error.status === 404) notFound();
    throw error;
  });
  const [admins, cities, existingOwner] = await Promise.all([
    listAdmins(),
    listCities(),
    prospect.ownerProfileId ? null : existingOwnerForPhone(prospect.phone),
  ]);
  const path = `/admin/crm/${id}`;
  const waDigits = prospect.phone.replace(/\D/g, "");

  async function stageAction(formData: FormData) {
    "use server";
    const stage = String(formData.get("stage")) as ProspectStage;
    if (!PROSPECT_STAGES.includes(stage)) return;
    const lostReason = String(formData.get("lostReason") ?? "").trim() || undefined;
    await changeStage(id, stage, admin.id, { lostReason });
    revalidatePath(path);
  }

  async function logAction(formData: FormData) {
    "use server";
    const type = String(formData.get("type")) as (typeof LOG_TYPES)[number];
    if (!LOG_TYPES.includes(type)) return;
    await addActivity(id, type, String(formData.get("body") ?? ""), admin.id);
    revalidatePath(path);
  }

  async function followUpAction(formData: FormData) {
    "use server";
    const at = parseIstDateTimeLocal(String(formData.get("at") ?? ""));
    if (!at) return;
    await setFollowUp(id, at, admin.id, String(formData.get("note") ?? "").trim() || undefined);
    revalidatePath(path);
  }

  async function clearFollowUpAction() {
    "use server";
    await setFollowUp(id, null, admin.id);
    revalidatePath(path);
  }

  async function assignAction(formData: FormData) {
    "use server";
    const assignee = String(formData.get("assignedToId") ?? "");
    await assignProspect(id, assignee || null);
    revalidatePath(path);
  }

  const owner = prospect.ownerProfile;

  return (
    <div className="space-y-5">
      <div>
        <Link
          href="/admin/crm"
          className="inline-flex min-h-11 items-center gap-1 text-sm font-medium text-ink/70 hover:text-ink"
        >
          <ArrowLeft className="h-4 w-4" />
          CRM
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">{prospect.name}</h1>
            <p className="text-sm text-muted-foreground">
              {[prospect.pgName, prospect.area?.name, prospect.city?.name].filter(Boolean).join(" · ") || "No PG details yet"}
              {prospect.approxBeds ? ` · ~${prospect.approxBeds} beds` : ""} · {SOURCE_LABEL[prospect.source]} · added{" "}
              {formatUpdatedAt(prospect.createdAt)}
            </p>
          </div>
          <span
            className={cn(
              "rounded-full px-3 py-1 text-xs font-semibold",
              prospect.stage === "LOST"
                ? "bg-red-50 text-red-700"
                : prospect.stage === "ONBOARDED" || prospect.stage === "LISTED"
                  ? "bg-green-50 text-green-700"
                  : "bg-amber-50 text-amber-700",
            )}
          >
            {STAGE_LABEL[prospect.stage]}
          </span>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button asChild size="sm" variant="outline">
            <a href={`tel:${prospect.phone}`}>
              <Phone className="h-4 w-4" />
              Call {prospect.phone}
            </a>
          </Button>
          <Button asChild size="sm" variant="outline">
            <a href={`https://wa.me/${waDigits}`} target="_blank" rel="noreferrer">
              <MessageCircle className="h-4 w-4" />
              WhatsApp
            </a>
          </Button>
          <Button asChild size="sm">
            <Link href={`/admin/pgs/new?prospectId=${prospect.id}`}>
              <Building2 className="h-4 w-4" />
              {owner ? "List another PG" : "Convert to listing"}
            </Link>
          </Button>
        </div>
        {existingOwner ? (
          <p className="mt-3 rounded-[14px] bg-amber-50 px-4 py-2 text-sm text-amber-800">
            {existingOwner.name ?? existingOwner.phone} already has an owner account. Converting will add the PG to
            that account instead of creating a new login.
          </p>
        ) : null}
      </div>

      {owner ? (
        <section className="rounded-[18px] bg-white p-4 shadow-card text-sm">
          <h2 className="font-semibold">Linked owner account</h2>
          <p className="mt-1 text-muted-foreground">
            {owner.user.name ?? "Owner"} · {owner.user.phone} ·{" "}
            {owner.user.lastLoginAt ? `last login ${formatUpdatedAt(owner.user.lastLoginAt)}` : "has not logged in yet"}
          </p>
          <ul className="mt-2 flex flex-wrap gap-2">
            {owner.properties.map((pg) => (
              <li key={pg.id}>
                <Link href={`/admin/pgs/${pg.id}`} className="rounded-full bg-canvas px-3 py-1 hover:underline">
                  {pg.name} · {pg.status.replace("_", " ").toLowerCase()}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="space-y-4 rounded-[18px] bg-white p-4 shadow-card">
          <h2 className="font-semibold">Pipeline</h2>
          <form action={stageAction} className="flex flex-wrap items-center gap-2">
            <select name="stage" defaultValue={prospect.stage} className={selectClass}>
              {PROSPECT_STAGES.map((s) => (
                <option key={s} value={s}>
                  {STAGE_LABEL[s]}
                </option>
              ))}
            </select>
            <Input
              name="lostReason"
              placeholder="Reason (if lost)"
              defaultValue={prospect.lostReason ?? ""}
              className="max-w-[12rem]"
            />
            <Button type="submit" size="sm" variant="outline">
              Update stage
            </Button>
          </form>

          <form action={assignAction} className="flex flex-wrap items-center gap-2">
            <select name="assignedToId" defaultValue={prospect.assignedToId ?? ""} className={selectClass}>
              <option value="">Unassigned</option>
              {admins.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name ?? a.phone}
                </option>
              ))}
            </select>
            <Button type="submit" size="sm" variant="outline">
              Assign
            </Button>
          </form>

          <div>
            <p className="text-sm">
              Next follow-up:{" "}
              <span className="font-medium">
                {prospect.nextFollowUpAt ? formatIst(prospect.nextFollowUpAt) : "not set"}
              </span>
            </p>
            <form action={followUpAction} className="mt-2 flex flex-wrap items-center gap-2">
              <Input
                type="datetime-local"
                name="at"
                required
                defaultValue={prospect.nextFollowUpAt ? toIstDateTimeLocal(prospect.nextFollowUpAt) : ""}
                className="max-w-[14rem]"
              />
              <Input name="note" placeholder="What to follow up on" className="max-w-[14rem]" />
              <Button type="submit" size="sm" variant="outline">
                Set
              </Button>
            </form>
            {prospect.nextFollowUpAt ? (
              <form action={clearFollowUpAction} className="mt-1">
                <Button type="submit" size="sm" variant="ghost">
                  Clear follow-up
                </Button>
              </form>
            ) : null}
          </div>
        </section>

        <section className="rounded-[18px] bg-white p-4 shadow-card">
          <h2 className="font-semibold">Log activity</h2>
          <form action={logAction} className="mt-3 space-y-2">
            <select name="type" defaultValue="CALL" className={selectClass}>
              {LOG_TYPES.map((t) => (
                <option key={t} value={t}>
                  {ACTIVITY_LABEL[t]}
                </option>
              ))}
            </select>
            <textarea
              name="body"
              required
              rows={3}
              placeholder="What happened? e.g. Spoke to owner, interested, wants a visit on Saturday"
              className="w-full rounded-xl border border-border bg-white px-3 py-2 text-sm outline-none focus:border-primary"
            />
            <Button type="submit" size="sm">
              Add to timeline
            </Button>
          </form>
        </section>
      </div>

      <section className="rounded-[18px] bg-white p-4 shadow-card">
        <h2 className="font-semibold">Timeline</h2>
        <ol className="mt-3 space-y-3 text-sm">
          {prospect.activities.map((a) => (
            <li key={a.id} className="border-l-2 border-border pl-3">
              <p>
                <span className="font-medium">{ACTIVITY_LABEL[a.type]}</span>
                {a.body ? <span className="whitespace-pre-line text-ink/80"> · {a.body}</span> : null}
              </p>
              <p className="text-xs text-muted-foreground">
                {a.actor?.name ?? a.actor?.phone ?? "system"} · {formatIst(a.createdAt)}
              </p>
            </li>
          ))}
        </ol>
      </section>

      <details className="rounded-[18px] bg-white p-4 shadow-card">
        <summary className="cursor-pointer font-semibold">Edit prospect details</summary>
        <div className="mt-4">
          <ProspectForm
            prospectId={prospect.id}
            cities={cities.map((c) => ({ id: c.id, name: c.name, areas: c.areas.map((ar) => ({ id: ar.id, name: ar.name })) }))}
            admins={admins}
            initial={{
              name: prospect.name,
              phone: prospect.phone.replace(/^\+91/, ""),
              businessName: prospect.businessName ?? "",
              pgName: prospect.pgName ?? "",
              cityId: prospect.cityId ?? "",
              areaId: prospect.areaId ?? "",
              address: prospect.address ?? "",
              approxBeds: prospect.approxBeds ? String(prospect.approxBeds) : "",
              source: prospect.source,
              assignedToId: prospect.assignedToId ?? "",
            }}
          />
        </div>
      </details>
    </div>
  );
}
