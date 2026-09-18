import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { toPublicCard } from "@/modules/search";
import { PgCard } from "@/components/search/pg-card";

export const dynamic = "force-dynamic";

export default async function SavedPage() {
  const user = await requireUser();
  const saved = await prisma.savedProperty.findMany({
    where: { userId: user.id },
    include: {
      property: {
        include: {
          city: true,
          area: true,
          photos: { orderBy: { sortOrder: "asc" }, take: 4 },
          amenities: { include: { amenity: true } },
          roomTypes: { orderBy: { rent: "asc" } },
        },
      },
    },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold">Your saved PGs</h1>
      {saved.length === 0 ? (
        <div className="mt-6 rounded-[24px] bg-primary-soft px-6 py-10 text-center">
          <p className="font-semibold">No saved PGs yet</p>
          <p className="mt-1 text-sm text-muted-foreground">Tap the heart on a listing to keep it here.</p>
          <Link href="/pgs" className="mt-4 inline-block font-semibold text-ink">
            Find your next PG
          </Link>
        </div>
      ) : (
        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          {saved.map((row) => (
            <PgCard key={row.propertyId} property={toPublicCard(row.property)} />
          ))}
        </div>
      )}
    </div>
  );
}
