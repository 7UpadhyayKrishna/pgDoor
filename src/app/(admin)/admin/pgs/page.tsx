import { requireAdmin } from "@/lib/session";
import { listForAdmin, moderateProperty, setVerificationLevel } from "@/modules/verification";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function AdminPgsPage() {
  const admin = await requireAdmin();
  const pgs = await listForAdmin();

  return (
    <div>
      <h1 className="text-2xl font-bold">Properties</h1>
      <ul className="mt-6 space-y-3">
        {pgs.map((pg) => (
          <li key={pg.id} className="rounded-[18px] bg-white p-4 shadow-card">
            <p className="font-semibold">{pg.name}</p>
            <p className="text-xs text-muted-foreground">
              {pg.status} · {pg.verificationLevel} · {pg.area.name}, {pg.city.name} ·{" "}
              {pg.owner.user.phone}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <form
                action={async () => {
                  "use server";
                  await moderateProperty(pg.id, "APPROVE", admin.id);
                }}
              >
                <Button size="sm">Approve</Button>
              </form>
              <form
                action={async () => {
                  "use server";
                  await moderateProperty(pg.id, "SUSPEND", admin.id);
                }}
              >
                <Button size="sm" variant="outline">
                  Suspend
                </Button>
              </form>
              <form
                action={async () => {
                  "use server";
                  await setVerificationLevel(pg.id, "PGDOOR_VERIFIED", admin.id);
                }}
              >
                <Button size="sm" variant="secondary">
                  Verify
                </Button>
              </form>
              <form
                action={async () => {
                  "use server";
                  await moderateProperty(pg.id, "FEATURE", admin.id);
                }}
              >
                <Button size="sm" variant="ghost">
                  Feature
                </Button>
              </form>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
