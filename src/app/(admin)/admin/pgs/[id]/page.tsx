import Link from "next/link";
import { notFound } from "next/navigation";
import { revalidatePath } from "next/cache";
import { ArrowLeft, ExternalLink, Pencil } from "lucide-react";
import { requireAdminPage } from "@/lib/session";
import { HttpError } from "@/lib/rbac";
import { formatInr, formatUpdatedAt } from "@/lib/format";
import { PG_TYPE_LABEL, SHARING_LABEL, VERIFICATION_LABEL } from "@/lib/constants";
import {
  CHECK_LABEL,
  CHECK_TYPES,
  checkProgress,
  getPropertyForVerification,
  moderateProperty,
  propertyAuditTrail,
  setVerificationLevel,
} from "@/modules/verification";
import { Button } from "@/components/ui/button";
import { VerificationChecklist, type ChecklistItem } from "@/components/admin/verification-checklist";
import { ResetPasswordButton } from "@/components/admin/reset-password-button";

export const dynamic = "force-dynamic";

const AUDIT_LABEL: Record<string, string> = {
  APPROVE: "Approved",
  REJECT: "Rejected",
  SUSPEND: "Suspended",
  FEATURE: "Featured",
  UNFEATURE: "Unfeatured",
  VERIFY: "Verification level set",
  CHECK: "Checklist updated",
  ADMIN_LISTED: "Listed by admin",
};

type AuditMeta = { type?: string; status?: string; level?: string; notes?: string | null } | null;

function auditDetail(action: string, metadata: unknown) {
  const meta = metadata as AuditMeta;
  if (action === "CHECK" && meta?.type) {
    const title = CHECK_LABEL[meta.type as keyof typeof CHECK_LABEL]?.title ?? meta.type;
    return `${title}: ${meta.status?.toLowerCase().replace("_", " ")}${meta.notes ? ` — ${meta.notes}` : ""}`;
  }
  if (action === "VERIFY" && meta?.level) return VERIFICATION_LABEL[meta.level] ?? meta.level;
  return null;
}

export default async function AdminPgDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const admin = await requireAdminPage(`/admin/pgs/${id}`);
  const [pg, audit] = await Promise.all([
    getPropertyForVerification(id).catch((error) => {
      if (error instanceof HttpError && error.status === 404) notFound();
      throw error;
    }),
    propertyAuditTrail(id),
  ]);

  const byType = new Map(pg.verificationChecks.map((c) => [c.type, c]));
  const items: ChecklistItem[] = CHECK_TYPES.map((type) => {
    const check = byType.get(type);
    return {
      type,
      ...CHECK_LABEL[type],
      status: check?.status ?? "PENDING",
      notes: check?.notes ?? "",
      evidenceUrls: check?.evidenceUrls ?? [],
      checkedBy: check?.checkedBy?.name ?? check?.checkedBy?.phone ?? null,
      checkedAt: check?.checkedAt?.toISOString() ?? null,
    };
  });
  const progress = checkProgress(items);

  async function moderate(action: "APPROVE" | "REJECT" | "SUSPEND" | "FEATURE" | "UNFEATURE") {
    "use server";
    await moderateProperty(id, action, admin.id);
    revalidatePath(`/admin/pgs/${id}`);
  }

  async function verifyAll() {
    "use server";
    await setVerificationLevel(id, "PGDOOR_VERIFIED", admin.id);
    revalidatePath(`/admin/pgs/${id}`);
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/pgs"
          className="inline-flex min-h-11 items-center gap-1 text-sm font-medium text-ink/70 hover:text-ink"
        >
          <ArrowLeft className="h-4 w-4" />
          Properties
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">{pg.name}</h1>
            <p className="text-sm text-muted-foreground">
              {PG_TYPE_LABEL[pg.pgType]} · {pg.area.name}, {pg.city.name} · added {formatUpdatedAt(pg.createdAt)}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild size="sm" variant="outline">
              <Link href={`/owners/properties/${pg.id}/edit`}>
                <Pencil className="h-4 w-4" />
                Edit listing
              </Link>
            </Button>
            <Button asChild size="sm" variant="ghost">
              <Link href={`/pg/${pg.slug}`} target="_blank">
                <ExternalLink className="h-4 w-4" />
                Public page
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-[18px] bg-white p-4 shadow-card">
          <p className="text-xs text-muted-foreground">Status</p>
          <p className="mt-1 font-semibold">{pg.status.replace("_", " ")}</p>
          {pg.featured ? <p className="text-xs text-primary">Featured</p> : null}
        </div>
        <div className="rounded-[18px] bg-white p-4 shadow-card">
          <p className="text-xs text-muted-foreground">Verification</p>
          <p className="mt-1 font-semibold">{VERIFICATION_LABEL[pg.verificationLevel]}</p>
          <p className="text-xs text-muted-foreground">
            {progress.done}/{progress.total} checks done
            {progress.failed ? ` · ${progress.failed} failed` : ""}
          </p>
        </div>
        <div className="rounded-[18px] bg-white p-4 shadow-card">
          <p className="text-xs text-muted-foreground">Owner</p>
          <p className="mt-1 font-semibold">{pg.owner.user.name ?? "Unnamed"}</p>
          <p className="text-xs text-muted-foreground">
            {pg.owner.user.phone} ·{" "}
            {pg.owner.user.lastLoginAt ? `last login ${formatUpdatedAt(pg.owner.user.lastLoginAt)}` : "never logged in"}
          </p>
        </div>
      </div>

      <section className="rounded-[18px] bg-white p-4 shadow-card">
        <h2 className="font-semibold">Listing summary</h2>
        <p className="mt-1 text-sm">{pg.address}</p>
        <ul className="mt-2 flex flex-wrap gap-2 text-sm">
          {pg.roomTypes.map((rt) => (
            <li key={rt.id} className="rounded-full bg-canvas px-3 py-1">
              {SHARING_LABEL[rt.sharingType]}: {formatInr(rt.rent)} · {rt.availableBeds}/{rt.totalBeds} beds
            </li>
          ))}
        </ul>
        <p className="mt-2 text-xs text-muted-foreground">
          Contact on listing: {pg.contactName ?? "—"} {pg.contactPhone ?? ""} · {pg._count.leads} leads ·{" "}
          {pg._count.reports} reports
        </p>
        {pg.photos.length ? (
          <div className="mt-3 flex gap-2 overflow-x-auto">
            {pg.photos.map((photo) => (
              <a key={photo.id} href={photo.url} target="_blank" rel="noreferrer" className="shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photo.url} alt={photo.alt ?? pg.name} className="h-20 w-28 rounded-lg object-cover" />
              </a>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-sm text-amber-700">No photos uploaded.</p>
        )}
      </section>

      <section className="rounded-[18px] bg-white p-4 shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="font-semibold">Verification checklist</h2>
            <p className="text-xs text-muted-foreground">
              The badge level updates automatically as checks are ticked. Property, owner, photos and address must
              pass for &quot;Property verified&quot;; all seven for &quot;pgDoor Verified&quot;.
            </p>
          </div>
          <form action={verifyAll}>
            <Button type="submit" size="sm" variant="ghost">
              Mark all passed
            </Button>
          </form>
        </div>
        <div className="mt-4">
          <VerificationChecklist propertyId={pg.id} items={items} />
        </div>
      </section>

      <section className="rounded-[18px] bg-white p-4 shadow-card">
        <h2 className="font-semibold">Moderation</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          <form action={moderate.bind(null, "APPROVE")}>
            <Button size="sm" disabled={pg.status === "PUBLISHED"}>
              Approve &amp; publish
            </Button>
          </form>
          <form action={moderate.bind(null, "REJECT")}>
            <Button size="sm" variant="outline" disabled={pg.status === "REJECTED"}>
              Reject
            </Button>
          </form>
          <form action={moderate.bind(null, "SUSPEND")}>
            <Button size="sm" variant="outline" disabled={pg.status === "SUSPENDED"}>
              Suspend
            </Button>
          </form>
          <form action={moderate.bind(null, pg.featured ? "UNFEATURE" : "FEATURE")}>
            <Button size="sm" variant="ghost">
              {pg.featured ? "Unfeature" : "Feature"}
            </Button>
          </form>
          <ResetPasswordButton
            ownerProfileId={pg.ownerId}
            label={pg.owner.user.passwordHash ? "Reset owner password" : "Issue owner password"}
          />
        </div>
        {pg.status !== "PUBLISHED" && progress.done < progress.total ? (
          <p className="mt-2 text-xs text-amber-700">
            {progress.total - progress.done} checks are still open. You can approve anyway, but the badge will show{" "}
            {VERIFICATION_LABEL[pg.verificationLevel]}.
          </p>
        ) : null}
      </section>

      <section className="rounded-[18px] bg-white p-4 shadow-card">
        <h2 className="font-semibold">History</h2>
        {audit.length ? (
          <ol className="mt-3 space-y-2 text-sm">
            {audit.map((entry) => {
              const detail = auditDetail(entry.action, entry.metadata);
              return (
                <li key={entry.id} className="border-l-2 border-border pl-3">
                  <p>
                    <span className="font-medium">{AUDIT_LABEL[entry.action] ?? entry.action}</span>
                    {detail ? <span className="text-muted-foreground"> · {detail}</span> : null}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {entry.actor?.name ?? entry.actor?.phone ?? "system"} · {formatUpdatedAt(entry.createdAt)}
                  </p>
                </li>
              );
            })}
          </ol>
        ) : (
          <p className="mt-2 text-sm text-muted-foreground">No admin actions yet.</p>
        )}
      </section>
    </div>
  );
}
