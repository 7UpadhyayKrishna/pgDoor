import Link from "next/link";
import Image from "next/image";
import { CheckCircle2, ImageOff, MapPin, Pencil } from "lucide-react";
import type { PropertyStatus } from "@prisma/client";
import { requireOwnerPage } from "@/lib/session";
import { listOwnerProperties } from "@/modules/properties";
import { Button } from "@/components/ui/button";
import { formatInr } from "@/lib/format";
import { cn } from "@/lib/utils";
import { isPrelaunch, LAUNCH_DATE_SHORT } from "@/lib/launch";
import { completeness, propertyToDraft } from "@/components/owner/wizard/draft";

export const dynamic = "force-dynamic";

function statusBadge(status: PropertyStatus, prelaunch: boolean) {
  switch (status) {
    case "PUBLISHED":
      return {
        label: prelaunch ? `Approved · live ${LAUNCH_DATE_SHORT}` : "Live",
        className: "bg-green-50 text-green-700",
      };
    case "PENDING_REVIEW":
      return { label: "Under review", className: "bg-amber-50 text-amber-700" };
    case "REJECTED":
      return { label: "Needs changes", className: "bg-red-50 text-red-700" };
    case "SUSPENDED":
      return { label: "Suspended", className: "bg-red-50 text-red-700" };
    default:
      return { label: "Draft", className: "bg-slate-100 text-slate-700" };
  }
}

export default async function OwnerPropertiesPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  const user = await requireOwnerPage("/owners/properties");
  if (!user.ownerProfileId) {
    return <p>Complete owner registration first.</p>;
  }
  const [{ saved }, properties] = await Promise.all([searchParams, listOwnerProperties(user.ownerProfileId)]);
  const prelaunch = isPrelaunch();

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">My listings</h1>
        <Button asChild>
          <Link href="/owners/register">+ Add PG</Link>
        </Button>
      </div>

      {saved ? (
        <p className="mt-4 flex items-center gap-2 rounded-[14px] bg-green-50 px-4 py-3 text-sm font-medium text-green-800">
          <CheckCircle2 className="h-4 w-4" />
          Your changes are saved.
        </p>
      ) : null}

      {properties.length === 0 ? (
        <div className="mt-6 rounded-[18px] bg-white p-6 text-center shadow-card">
          <p className="font-semibold">No listings yet</p>
          <p className="mt-1 text-sm text-muted-foreground">List your first PG for free in about 5 minutes.</p>
          <Button asChild className="mt-4">
            <Link href="/owners/register">List your PG</Link>
          </Button>
        </div>
      ) : null}

      <ul className="mt-6 grid gap-4 sm:grid-cols-2">
        {properties.map((p) => {
          const badge = statusBadge(p.status, prelaunch);
          const cover = p.photos[0]?.url;
          const score = completeness(
            propertyToDraft({ ...p, roomTypes: p.roomTypes.map((rt) => ({ ...rt, rooms: [] })) }),
          );
          return (
            <li key={p.id} className="overflow-hidden rounded-[18px] bg-white shadow-card">
              <div className="relative aspect-[16/9] bg-canvas">
                {cover ? (
                  <Image
                    src={cover}
                    alt={p.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 100vw, 400px"
                    unoptimized={cover.startsWith("/uploads/")}
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-muted-foreground">
                    <ImageOff className="h-8 w-8" />
                  </div>
                )}
                <span
                  className={cn(
                    "absolute left-3 top-3 rounded-full px-2.5 py-1 text-xs font-semibold",
                    badge.className,
                  )}
                >
                  {badge.label}
                </span>
              </div>
              <div className="p-4">
                <p className="font-semibold text-ink">{p.name}</p>
                <p className="mt-0.5 flex items-center gap-1 text-sm text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5" />
                  {p.area.name}, {p.city.name}
                </p>
                <p className="mt-2 text-sm text-ink">
                  From <span className="font-semibold">{formatInr(p.minRent)}</span> · {p.availableBeds} of{" "}
                  {p.totalBeds} beds free
                </p>
                <div className="mt-3">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Listing completeness</span>
                    <span className="font-semibold text-ink">{score}%</span>
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-canvas">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${score}%` }} />
                  </div>
                </div>
                <Button asChild variant="outline" className="mt-4 w-full">
                  <Link href={`/owners/properties/${p.id}/edit`}>
                    <Pencil className="h-4 w-4" />
                    {score < 100 ? "Edit and complete listing" : "Edit listing"}
                  </Link>
                </Button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
