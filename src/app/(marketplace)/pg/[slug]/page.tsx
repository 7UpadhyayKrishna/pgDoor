import Link from "next/link";
import { ArrowLeft, Heart, MapPin, Share2, Star } from "lucide-react";
import { Gallery } from "@/components/listing/gallery";
import { StickyCta } from "@/components/listing/sticky-cta";
import { Badge } from "@/components/ui/badge";
import { SHARING_LABEL } from "@/lib/constants";
import { formatInr, formatUpdatedAt } from "@/lib/format";
import { mapsEmbedUrl } from "@/lib/maps";
import { getPublishedBySlug, incrementView } from "@/modules/properties";
import { ReportListing } from "@/components/listing/report-listing";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function PgDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const property = await getPublishedBySlug(slug);
  if (!property) notFound();
  await incrementView(slug);

  const primaryRoom = property.roomTypes[0];
  const scores = property.reviews[0]?.scores;
  const full = property.availableBeds <= 0;

  return (
    <div className="pb-32 md:pb-28 lg:pb-8">
      <div className="container-pg flex items-center justify-between py-2 sm:py-3">
        <Link href="/pgs" className="flex h-11 w-11 items-center justify-center rounded-full hover:bg-white">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex gap-1">
          <button type="button" className="flex h-11 w-11 items-center justify-center rounded-full hover:bg-white" aria-label="Share">
            <Share2 className="h-5 w-5" />
          </button>
          <Link href="/saved" className="flex h-11 w-11 items-center justify-center rounded-full hover:bg-white" aria-label="Save">
            <Heart className="h-5 w-5" />
          </Link>
        </div>
      </div>

      <div className="md:container-pg">
        <Gallery photos={property.photos} name={property.name} />
      </div>

      <div className="container-pg mt-5 grid gap-8 sm:mt-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-ink sm:text-3xl">{property.name}</h1>
          <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground sm:text-base">
            <MapPin className="h-4 w-4 shrink-0" />
            {property.area.name}, {property.city.name}
          </p>
          {property.ratingAvg > 0 ? (
            <p className="mt-2 flex items-center gap-1 font-medium">
              <Star className="h-4 w-4 fill-ink" />
              {property.ratingAvg.toFixed(1)} · {property.reviewCount} reviews
            </p>
          ) : null}
          {property.verificationLevel !== "UNVERIFIED" ? (
            <Badge variant="verified" className="mt-3">
              ✓ Verified by pgDoor
            </Badge>
          ) : null}

          <p className="mt-6 text-2xl font-bold text-ink sm:text-3xl">
            {formatInr(property.minRent)}
            <span className="text-base font-medium text-muted-foreground">/month</span>
          </p>
          {primaryRoom ? (
            <p className="mt-1 text-sm text-muted-foreground">{SHARING_LABEL[primaryRoom.sharingType]}</p>
          ) : null}

          <dl className="mt-4 space-y-2 text-sm text-ink">
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Security deposit</dt>
              <dd className="shrink-0 font-medium">{formatInr(property.minDeposit)}</dd>
            </div>
            {property.maintenanceCharge != null ? (
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Maintenance</dt>
                <dd className="shrink-0 font-medium">{formatInr(property.maintenanceCharge)}</dd>
              </div>
            ) : null}
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Food</dt>
              <dd className="shrink-0 font-medium">{property.foodIncluded ? "Included" : "Not included"}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Electricity</dt>
              <dd className="min-w-0 text-right font-medium">{property.electricityNote ?? "Actual"}</dd>
            </div>
          </dl>

          <div className="mt-6 rounded-[18px] bg-canvas p-4">
            {full ? (
              <p className="font-semibold">Currently full</p>
            ) : (
              <p className="font-semibold text-success">
                {property.availableBeds} beds available
              </p>
            )}
            <p className="text-sm text-muted-foreground">
              Updated {formatUpdatedAt(property.availabilityConfirmedAt)}
            </p>
            {property.moveInFrom ? (
              <p className="mt-2 text-sm">
                Move-in from{" "}
                <span className="font-semibold">
                  {property.moveInFrom.toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </span>
              </p>
            ) : null}
          </div>

          <section className="mt-8">
            <h2 className="text-lg font-semibold">Amenities</h2>
            <ul className="mt-3 grid grid-cols-2 gap-3 text-sm sm:grid-cols-3 lg:grid-cols-4">
              {property.amenities.map((row) => (
                <li key={row.amenityId} className="rounded-xl bg-white px-3 py-3 shadow-card">
                  {row.amenity.name}
                </li>
              ))}
            </ul>
          </section>

          <section className="mt-8">
            <h2 className="text-lg font-semibold">Where you&apos;ll live</h2>
            <div className="mt-3 overflow-hidden rounded-[18px] border">
              <iframe
                title="Map"
                src={mapsEmbedUrl(property.latitude, property.longitude)}
                className="h-48 w-full sm:h-56"
              />
            </div>
          </section>

          {property.reviews.length ? (
            <section className="mt-8">
              <h2 className="text-2xl font-bold sm:text-3xl">{property.ratingAvg.toFixed(1)}</h2>
              <p className="text-sm text-muted-foreground">{property.reviewCount} reviews</p>
              {scores ? (
                <ul className="mt-4 space-y-2 text-sm">
                  {(
                    [
                      ["Cleanliness", scores.cleanliness],
                      ["Food", scores.food],
                      ["Location", scores.location],
                      ["Management", scores.management],
                      ["Value", scores.value],
                    ] as const
                  ).map(([label, value]) => (
                    <li key={label} className="flex items-center gap-3">
                      <span className="w-24 shrink-0 sm:w-28">{label}</span>
                      <div className="h-1.5 min-w-0 flex-1 rounded-full bg-canvas">
                        <div
                          className="h-1.5 rounded-full bg-ink"
                          style={{ width: `${(value / 5) * 100}%` }}
                        />
                      </div>
                      <span className="w-8 shrink-0 text-right">{value.toFixed(1)}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </section>
          ) : null}

          <div className="mt-8">
            <ReportListing propertyId={property.id} />
          </div>
        </div>
        <StickyCta
          propertyId={property.id}
          propertyName={property.name}
          minRent={property.minRent}
        />
      </div>
    </div>
  );
}
