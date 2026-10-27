import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { listCities } from "@/modules/locations";
import { ListingWizard } from "@/components/owner/wizard/listing-wizard";
import { LAUNCH_DATE_LABEL } from "@/lib/launch";
import { isPrelaunchForViewer } from "@/lib/launch-server";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "List your PG for free",
  description: "Add your PG on pgDoor in about 5 minutes. Free listing, no commission, direct tenant enquiries.",
};

export default async function OwnerRegisterPage() {
  const [user, cities, amenities, prelaunch] = await Promise.all([
    getCurrentUser(),
    listCities(),
    prisma.amenity.findMany({ orderBy: { name: "asc" }, select: { slug: true, name: true, group: true } }),
    isPrelaunchForViewer(),
  ]);

  return (
    <div className="container-pg py-6 md:py-10">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-2xl font-bold text-ink md:text-3xl">List your PG for free</h1>
        <p className="mt-1 text-sm text-muted-foreground md:text-base">
          About 5 minutes. You&apos;ll verify your phone number at the end.
          {prelaunch ? ` Tenants can find your PG from ${LAUNCH_DATE_LABEL}.` : ""}
        </p>
        <div className="mt-6">
          <ListingWizard
            mode="create"
            cities={cities}
            amenities={amenities}
            loggedIn={Boolean(user)}
            launchLabel={LAUNCH_DATE_LABEL}
          />
        </div>
      </div>
    </div>
  );
}
