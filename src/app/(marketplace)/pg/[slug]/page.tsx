import Link from "next/link";
import { ArrowLeft, MapPin, Star } from "lucide-react";
import { Gallery } from "@/components/listing/gallery";
import { ShareListingButton } from "@/components/listing/share-listing-button";
import { StickyCta } from "@/components/listing/sticky-cta";
import { NearbyPlaces } from "@/components/search/nearby-places";
import { NearbyEssentials } from "@/components/listing/nearby-essentials";
import { CommuteCard } from "@/components/listing/commute-card";
import { SaveButton } from "@/components/listing/save-button";
import { CommuteTrial } from "@/components/listing/commute-trial";
import { ScoreBreakdown } from "@/components/listing/score-breakdown";
import { Badge } from "@/components/ui/badge";
import type { Metadata } from "next";
import { cache } from "react";
import {
  PG_TYPE_LABEL,
  PREFERRED_TENANTS_LABEL,
  PUBLIC_VERIFIED_LEVELS,
  SHARING_LABEL,
  SHARING_ORDER,
  formatMeals,
} from "@/lib/constants";
import { formatDeposit, formatGateTime, formatInr, formatUpdatedAt } from "@/lib/format";
import { googleMapsPlaceUrl, mapsEmbedUrl } from "@/lib/maps";
import { parseCommuteMode, ALL_DETAIL_MODES } from "@/lib/commute/modes";
import { fillCommuteQuotes } from "@/modules/commute";
import { nearbyForProperty } from "@/modules/pois";
import { type Origin } from "@/lib/directions";
import { PgTypeBadge } from "@/components/search/pg-card";
import { getNearbyForArea } from "@/modules/locations";
import {
  getPublishedBySlug,
  getSimilarOpen,
  incrementView,
  resolveSlugRedirect,
} from "@/modules/properties";
import { ReportListing } from "@/components/listing/report-listing";
import { PgCard } from "@/components/search/pg-card";
import { notFound, permanentRedirect } from "next/navigation";

export const dynamic = "force-dynamic";

const loadProperty = cache((slug: string) => getPublishedBySlug(slug));

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const property = await loadProperty(slug);
  if (!property) return { robots: { index: false } };
  const place = `${property.area.name}, ${property.city.name}`;
  const rent = property.minRent > 0 ? ` · from ${formatInr(property.minRent)}` : "";
  const title = `${property.name}, ${property.area.name}${rent}`;
  const description = [
    `${PG_TYPE_LABEL[property.pgType] ?? "PG"} in ${place}`,
    property.minRent > 0 ? `rent from ${formatInr(property.minRent)}/month` : null,
    property.foodIncluded ? "food included" : null,
    `${property.amenities.length} amenities, house rules and commute times on pgDoor`,
  ]
    .filter(Boolean)
    .join(", ");
  const image = property.photos[0]?.url;
  const url = `/pg/${property.slug}`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      title,
      description,
      url,
      siteName: "pgDoor",
      images: image ? [{ url: image, alt: property.name }] : undefined,
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title,
      description,
      images: image ? [image] : undefined,
    },
  };
}

function parseOrigin(query: Record<string, string | string[] | undefined>): Origin | null {
  const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);
  const lat = Number(first(query.destLat));
  const lng = Number(first(query.destLng));
  if (!first(query.destLat) || !first(query.destLng) || Number.isNaN(lat) || Number.isNaN(lng)) {
    return null;
  }
  return { lat, lng, label: first(query.destLabel), mode: first(query.mode) };
}


export default async function PgDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const property = await loadProperty(slug);
  if (!property) {
    const current = await resolveSlugRedirect(slug);
    if (current) permanentRedirect(`/pg/${current}`);
    notFound();
  }
  // View counts are best-effort; never let them surface as page errors.
  void incrementView(slug).catch(() => undefined);

  const origin = parseOrigin(query);
  const productMode = parseCommuteMode(origin?.mode);
  const full = property.availableBeds <= 0;
  const [nearby, essentials, commuteProfile, similar] = await Promise.all([
    getNearbyForArea(property.areaId),
    nearbyForProperty(property.id, property.latitude, property.longitude),
    origin
      ? fillCommuteQuotes(
          [{ id: property.id, lat: property.latitude, lng: property.longitude, rent: property.minRent }],
          {
            destLat: origin.lat,
            destLng: origin.lng,
            destLabel: origin.label,
            mode: productMode,
          },
          ALL_DETAIL_MODES,
        ).then((map) => map.get(property.id) ?? null)
      : Promise.resolve(null),
    full ? getSimilarOpen(property).catch(() => []) : Promise.resolve([]),
  ]);

  // roomTypes come cheapest-first, so this is the room whose rent the hero shows.
  const primaryRoom = property.roomTypes[0];
  const heroDeposit = primaryRoom ? primaryRoom.deposit : property.minDeposit;
  const roomsInOrder = [...property.roomTypes].sort(
    (a, b) => SHARING_ORDER.indexOf(a.sharingType) - SHARING_ORDER.indexOf(b.sharingType),
  );
  const publiclyVerified = PUBLIC_VERIFIED_LEVELS.includes(property.verificationLevel);
  const scores = property.reviews[0]?.scores;
  const foodType = [property.vegetarianFood && "Veg", property.nonVegetarianFood && "Non-veg"]
    .filter(Boolean)
    .join(" & ");
  const yesNo = (allowed: boolean) => (allowed ? "Allowed" : "Not allowed");
  const rules: [string, string][] = [
    ["Preferred tenants", PREFERRED_TENANTS_LABEL[property.preferredTenants]],
    ["Gate closes", formatGateTime(property.gateClosingTime)],
    ["Visitors", yesNo(property.visitorsAllowed)],
    ["Cooking", yesNo(property.cookingAllowed)],
    ["Smoking", yesNo(property.smokingAllowed)],
    ["Alcohol", yesNo(property.alcoholAllowed)],
    ["Notice period", property.noticePeriodDays ? `${property.noticePeriodDays} days` : "None"],
    ["Lock-in", property.lockInMonths ? `${property.lockInMonths} months` : "None"],
  ];

  return (
    <div className="pb-32 md:pb-28 lg:pb-8">
      <div className="container-pg flex items-center justify-between py-2 sm:py-3">
        <Link href="/pgs" className="flex h-11 w-11 items-center justify-center rounded-full hover:bg-white">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex gap-1">
          <ShareListingButton slug={property.slug} name={property.name} />
          <SaveButton propertyId={property.id} className="hover:bg-white" />
        </div>
      </div>

      <div className="container-pg">
        <Gallery
          photos={property.photos}
          name={property.name}
          tourVideoUrl={property.tourVideoUrl}
          tourThumbnailUrl={property.tourThumbnailUrl}
        />
      </div>

      <div className="container-pg mt-5 grid gap-8 sm:mt-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-ink sm:text-3xl">{property.name}</h1>
          <p className="mt-1 flex items-start gap-1 text-sm text-muted-foreground sm:text-base">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              {property.area.name}, {property.city.name}
              {property.address ? (
                <>
                  <br />
                  <span className="text-sm">{property.address}</span>
                </>
              ) : null}
            </span>
          </p>
          <div className="mt-2">
            <PgTypeBadge pgType={property.pgType} />
          </div>
          {origin && commuteProfile ? (
            <>
              <CommuteCard
                profile={commuteProfile}
                destLabel={origin.label}
                destLat={origin.lat}
                destLng={origin.lng}
                rent={property.minRent}
                property={property}
              />
              <CommuteTrial quote={commuteProfile.recommended} destLabel={origin.label} />
            </>
          ) : null}
          {property.commuteBadges.length ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {property.commuteBadges.map((badge) => (
                <Badge key={badge} variant="verified">
                  {badge}
                </Badge>
              ))}
            </div>
          ) : null}
          <ScoreBreakdown
            livability={property.livabilityScore}
            livabilityBreakdown={property.livabilityBreakdown}
            safety={property.safetyScore}
            safetyBreakdown={property.safetyBreakdown}
          />
          {property.ratingAvg > 0 ? (
            <p className="mt-2 flex items-center gap-1 font-medium">
              <Star className="h-4 w-4 fill-ink" />
              {property.ratingAvg.toFixed(1)} · {property.reviewCount} reviews
            </p>
          ) : null}
          {publiclyVerified ? (
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
              <dd className="shrink-0 font-medium">
                {formatDeposit(heroDeposit)}
                {primaryRoom && property.roomTypes.length > 1 && heroDeposit != null ? (
                  <span className="font-normal text-muted-foreground">
                    {" "}
                    ({SHARING_LABEL[primaryRoom.sharingType].replace(" Sharing", "").toLowerCase()})
                  </span>
                ) : null}
              </dd>
            </div>
            {property.maintenanceCharge != null ? (
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Maintenance</dt>
                <dd className="shrink-0 font-medium">{formatInr(property.maintenanceCharge)}</dd>
              </div>
            ) : null}
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Food</dt>
              <dd className="min-w-0 text-right font-medium">
                {property.foodIncluded
                  ? [
                      formatMeals(property.mealsProvided) || "Included",
                      foodType,
                    ]
                      .filter(Boolean)
                      .join(" · ")
                  : "Not included"}
              </dd>
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

          {property.description ? (
            <section className="mt-8">
              <h2 className="text-lg font-semibold">About this PG</h2>
              <p className="mt-2 whitespace-pre-line text-sm leading-6 text-ink/80 sm:text-base">
                {property.description}
              </p>
            </section>
          ) : null}

          {property.roomTypes.length ? (
            <section className="mt-8">
              <h2 className="text-lg font-semibold">Rooms and rent</h2>
              <ul className="mt-3 space-y-2">
                {roomsInOrder.map((rt) => (
                  <li
                    key={rt.id}
                    className="flex items-center justify-between gap-3 rounded-xl bg-white px-4 py-3 text-sm shadow-card"
                  >
                    <div className="min-w-0">
                      <p className="font-semibold text-ink">{SHARING_LABEL[rt.sharingType]}</p>
                      <p className="text-muted-foreground">
                        Deposit {formatDeposit(rt.deposit)} ·{" "}
                        {rt.availableBeds > 0 ? `${rt.availableBeds} beds available` : "Full"}
                      </p>
                    </div>
                    <p className="shrink-0 font-bold text-ink">
                      {formatInr(rt.rent)}
                      <span className="text-xs font-medium text-muted-foreground">/bed</span>
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <section className="mt-8">
            <h2 className="text-lg font-semibold">Amenities</h2>
            <ul className="mt-3 grid grid-cols-2 gap-3 text-sm sm:grid-cols-3 lg:grid-cols-4">
              {property.amenities.map((row) => (
                <li key={row.amenityId} className="rounded-xl bg-white px-3 py-3 shadow-card">
                  {row.amenity.name}
                </li>
              ))}
            </ul>
            {property.otherAmenities ? (
              <p className="mt-3 text-sm text-muted-foreground">
                <span className="font-medium text-ink">Also: </span>
                {property.otherAmenities}
              </p>
            ) : null}
          </section>

          <section className="mt-8">
            <h2 className="text-lg font-semibold">House rules and terms</h2>
            <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
              {rules.map(([label, value]) => (
                <div key={label} className="flex justify-between gap-4 rounded-xl bg-white px-4 py-3 shadow-card">
                  <dt className="text-muted-foreground">{label}</dt>
                  <dd className="min-w-0 text-right font-medium text-ink">{value}</dd>
                </div>
              ))}
            </dl>
          </section>

          <NearbyEssentials places={essentials} />
          {nearby ? (
            <div className="mt-8">
              <NearbyPlaces areaName={nearby.areaName} places={nearby.places} />
            </div>
          ) : null}

          <section className="mt-8">
            <h2 className="text-lg font-semibold">Where you&apos;ll live</h2>
            <div className="mt-3 overflow-hidden rounded-[18px] border bg-canvas">
              <iframe
                title={`Map showing ${property.name}`}
                src={mapsEmbedUrl(property.latitude, property.longitude)}
                className="h-48 w-full sm:h-56"
                loading="lazy"
              />
              <div className="flex flex-wrap items-center justify-between gap-2 bg-white px-4 py-3 text-sm">
                <p className="min-w-0 text-muted-foreground">
                  {property.address || `${property.area.name}, ${property.city.name}`}
                </p>
                <a
                  href={googleMapsPlaceUrl(property.latitude, property.longitude)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 font-medium text-primary hover:underline"
                >
                  Open in Google Maps
                </a>
              </div>
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
                      ["Commute", scores.commute],
                      ["Safety", scores.safety],
                      ["Owner", scores.owner],
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

          {similar.length ? (
            <section className="mt-8">
              <h2 className="text-lg font-semibold">Similar PGs with open beds</h2>
              <p className="text-sm text-muted-foreground">
                {property.name} is full right now. These nearby PGs have beds free.
              </p>
              <div className="-mx-1 mt-3 flex gap-3 overflow-x-auto px-1 pb-2">
                {similar.map((pg) => (
                  <PgCard key={pg.id} property={pg} variant="rail" origin={origin} />
                ))}
              </div>
            </section>
          ) : null}

          <div className="mt-8">
            <ReportListing propertyId={property.id} />
          </div>
        </div>
        <StickyCta
          propertyId={property.id}
          propertyName={property.name}
          slug={property.slug}
          minRent={property.minRent}
          full={full}
        />
      </div>
    </div>
  );
}
