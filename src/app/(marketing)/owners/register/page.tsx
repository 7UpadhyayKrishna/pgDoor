import { getCurrentUser } from "@/lib/session";
import { ensureOwnerProfile } from "@/modules/auth";
import { prisma } from "@/lib/prisma";
import { listCities } from "@/modules/locations";
import { OwnerWizard } from "@/components/owner/owner-wizard";
import { PhoneLogin } from "@/components/auth/phone-login";
import { Suspense } from "react";

export const dynamic = "force-dynamic";

export default async function OwnerRegisterPage() {
  const user = await getCurrentUser();
  if (user) {
    await ensureOwnerProfile(user.id);
  }
  const [cities, amenities] = await Promise.all([
    listCities(),
    prisma.amenity.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="container-pg py-12">
      <h1 className="text-3xl font-bold">List your PG in under 5 minutes</h1>
      <p className="mt-2 text-muted-foreground">OTP login, then rooms, pricing and photos.</p>
      <div className="mt-8 max-w-2xl">
        {!user ? (
          <div className="rounded-2xl border bg-white p-6">
            <Suspense>
              <PhoneLogin purpose="OWNER_REGISTER" redirectTo="/owners/register" />
            </Suspense>
          </div>
        ) : (
          <OwnerWizard cities={cities} amenities={amenities} />
        )}
      </div>
    </div>
  );
}
