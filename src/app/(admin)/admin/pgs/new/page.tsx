import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireAdminPage } from "@/lib/session";
import { LAUNCH_DATE_LABEL } from "@/lib/launch";
import { listCities } from "@/modules/locations";
import { AdminListingFlow } from "@/components/admin/admin-listing-flow";

export const dynamic = "force-dynamic";

export default async function AdminNewPgPage({
  searchParams,
}: {
  searchParams: Promise<{ prospectId?: string }>;
}) {
  await requireAdminPage("/admin/pgs/new");
  const { prospectId } = await searchParams;
  const [cities, amenities, prospect] = await Promise.all([
    listCities(),
    prisma.amenity.findMany({ orderBy: { name: "asc" }, select: { slug: true, name: true, group: true } }),
    prospectId ? prisma.ownerProspect.findUnique({ where: { id: prospectId } }) : null,
  ]);

  return (
    <div className="max-w-2xl">
      <Link
        href={prospect ? `/admin/crm/${prospect.id}` : "/admin/pgs"}
        className="inline-flex min-h-11 items-center gap-1 text-sm font-medium text-ink/70 hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" />
        {prospect ? "Back to prospect" : "Properties"}
      </Link>
      <h1 className="mt-1 text-2xl font-bold">List a PG for an owner</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {prospect
          ? `Converting CRM prospect ${prospect.name}${prospect.pgName ? ` (${prospect.pgName})` : ""}.`
          : "Create the owner's login and their PG listing in one go."}
      </p>
      <div className="mt-6">
        <AdminListingFlow
          cities={cities}
          amenities={amenities}
          launchLabel={LAUNCH_DATE_LABEL}
          prospectId={prospect?.id}
          initialOwner={
            prospect
              ? {
                  name: prospect.name,
                  phone: prospect.phone.replace(/^\+91/, ""),
                  businessName: prospect.businessName ?? "",
                }
              : undefined
          }
          prefill={
            prospect
              ? {
                  ...(prospect.pgName ? { name: prospect.pgName } : {}),
                  ...(prospect.cityId ? { cityId: prospect.cityId } : {}),
                  ...(prospect.areaId ? { areaId: prospect.areaId } : {}),
                  ...(prospect.address ? { addressLine: prospect.address } : {}),
                }
              : undefined
          }
        />
      </div>
    </div>
  );
}
