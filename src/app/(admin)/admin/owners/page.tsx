import Link from "next/link";
import { requireAdminPage } from "@/lib/session";
import { formatUpdatedAt } from "@/lib/format";
import { cn } from "@/lib/utils";
import { listOwnersForAdmin } from "@/modules/admin-listing";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ResetPasswordButton } from "@/components/admin/reset-password-button";

export const dynamic = "force-dynamic";

type OwnerRow = Awaited<ReturnType<typeof listOwnersForAdmin>>[number];

function credentialStatus(owner: OwnerRow) {
  const { user } = owner;
  if (user.blocked) return { label: "Blocked", className: "bg-red-50 text-red-700" };
  if (!user.passwordHash) return { label: "OTP only", className: "bg-slate-100 text-slate-700" };
  if (!user.lastLoginAt) return { label: "Issued, never logged in", className: "bg-amber-50 text-amber-700" };
  if (user.mustChangePassword) return { label: "Must change password", className: "bg-amber-50 text-amber-700" };
  return { label: "Active", className: "bg-green-50 text-green-700" };
}

export default async function AdminOwnersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  await requireAdminPage("/admin/owners");
  const { q } = await searchParams;
  const owners = await listOwnersForAdmin(q);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Owners</h1>
        <Button asChild>
          <Link href="/admin/pgs/new">+ List a PG</Link>
        </Button>
      </div>
      <form className="mt-4 flex gap-2">
        <Input name="q" defaultValue={q} placeholder="Search name, business or phone" className="max-w-sm" />
        <Button type="submit" variant="outline">
          Search
        </Button>
      </form>

      <ul className="mt-6 space-y-3">
        {owners.map((owner) => {
          const status = credentialStatus(owner);
          return (
            <li key={owner.id} className="rounded-[18px] bg-white p-4 shadow-card">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">
                    {owner.user.name ?? "Unnamed owner"}
                    {owner.businessName ? (
                      <span className="font-normal text-muted-foreground"> · {owner.businessName}</span>
                    ) : null}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {owner.user.phone} · {owner._count.properties} PG{owner._count.properties === 1 ? "" : "s"} ·{" "}
                    {owner.user.lastLoginAt ? `last login ${formatUpdatedAt(owner.user.lastLoginAt)}` : "never logged in"}
                    {owner.credentialIssuedAt ? ` · password issued ${formatUpdatedAt(owner.credentialIssuedAt)}` : ""}
                  </p>
                </div>
                <span className={cn("rounded-full px-2.5 py-1 text-xs font-semibold", status.className)}>
                  {status.label}
                </span>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <ResetPasswordButton
                  ownerProfileId={owner.id}
                  label={owner.user.passwordHash ? "Reset password" : "Issue password"}
                />
                <Button asChild size="sm" variant="ghost">
                  <Link href={`/admin/pgs?owner=${owner.id}`}>View PGs</Link>
                </Button>
              </div>
            </li>
          );
        })}
        {owners.length === 0 ? (
          <li className="rounded-[18px] bg-white p-6 text-center text-sm text-muted-foreground shadow-card">
            No owners found.
          </li>
        ) : null}
      </ul>
    </div>
  );
}
