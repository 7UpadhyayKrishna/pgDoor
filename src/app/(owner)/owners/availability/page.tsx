import { requireOwner } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { confirmAvailability } from "@/modules/inventory";
import { Button } from "@/components/ui/button";
import { formatUpdatedAt } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function OwnerAvailabilityPage() {
  const user = await requireOwner();
  if (!user.ownerProfileId) {
    return <p>Complete owner registration first.</p>;
  }
  const properties = await prisma.property.findMany({
    where: { ownerId: user.ownerProfileId },
    include: {
      rooms: { include: { beds: true, roomType: true } },
    },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold">Availability</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Confirm vacancies so seekers see “updated just now”, not a dead listing.
      </p>
      <div className="mt-6 space-y-6">
        {properties.map((property) => (
          <section key={property.id} className="rounded-[18px] bg-white p-5 shadow-card">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-semibold">{property.name}</p>
                <p className="text-sm text-muted-foreground">
                  {property.availableBeds} beds open · confirmed {formatUpdatedAt(property.availabilityConfirmedAt)}
                </p>
              </div>
              <form
                action={async () => {
                  "use server";
                  await confirmAvailability(property.id);
                }}
              >
                <Button type="submit" variant="outline">
                  Still available
                </Button>
              </form>
            </div>
            <ul className="mt-4 space-y-2 text-sm">
              {property.rooms.map((room) => (
                <li key={room.id} className="flex justify-between rounded-xl bg-secondary px-3 py-2">
                  <span>
                    {room.name} · {room.roomType.sharingType}
                  </span>
                  <span>
                    {room.beds.filter((b) => b.status === "AVAILABLE").length}/{room.totalBeds} available
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
