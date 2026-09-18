import Link from "next/link";
import { requireOwner } from "@/lib/session";
import { listOwnerProperties } from "@/modules/properties";
import { Button } from "@/components/ui/button";
import { formatInr } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function OwnerPropertiesPage() {
  const user = await requireOwner();
  if (!user.ownerProfileId) {
    return <p>Complete owner registration first.</p>;
  }
  const properties = await listOwnerProperties(user.ownerProfileId);

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Properties</h1>
        <Button asChild>
          <Link href="/owners/register">Add PG</Link>
        </Button>
      </div>
      <ul className="mt-6 space-y-3">
        {properties.map((p) => (
          <li key={p.id} className="rounded-[18px] bg-white p-4 shadow-card">
            <p className="font-semibold">{p.name}</p>
            <p className="text-sm text-muted-foreground">
              {p.status} · {p.availableBeds} beds · from {formatInr(p.minRent)}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
