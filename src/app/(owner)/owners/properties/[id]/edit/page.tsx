import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireOwner } from "@/lib/session";
import { HttpError } from "@/lib/rbac";
import { LAUNCH_DATE_LABEL } from "@/lib/launch";
import { listCities } from "@/modules/locations";
import { getOwnerProperty } from "@/modules/properties";
import { ListingWizard } from "@/components/owner/wizard/listing-wizard";
import { propertyToDraft } from "@/components/owner/wizard/draft";

export const dynamic = "force-dynamic";

export default async function EditPropertyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireOwner();
  const property = await getOwnerProperty(user.ownerProfileId, id, user.role === "ADMIN").catch((error) => {
    if (error instanceof HttpError && error.status === 404) notFound();
    throw error;
  });
  const [cities, amenities] = await Promise.all([
    listCities(),
    prisma.amenity.findMany({ orderBy: { name: "asc" }, select: { slug: true, name: true, group: true } }),
  ]);

  return (
    <div className="max-w-2xl">
      <Link
        href="/owners/properties"
        className="inline-flex min-h-11 items-center gap-1 text-sm font-medium text-ink/70 hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" />
        My listings
      </Link>
      <h1 className="mt-1 text-2xl font-bold">Edit {property.name}</h1>
      <div className="mt-6">
        <ListingWizard
          mode="edit"
          propertyId={property.id}
          initialDraft={propertyToDraft(property)}
          cities={cities}
          amenities={amenities}
          loggedIn
          launchLabel={LAUNCH_DATE_LABEL}
        />
      </div>
    </div>
  );
}
