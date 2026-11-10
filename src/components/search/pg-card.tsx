"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { ImageOff, Navigation, Star } from "lucide-react";
import { SaveButton } from "@/components/listing/save-button";
import { Badge } from "@/components/ui/badge";
import {
  PG_TYPE_LABEL,
  PUBLIC_VERIFIED_LEVELS,
  SHARING_LABEL,
  STALE_AVAILABILITY_DAYS,
} from "@/lib/constants";
import { toggleCompare, useCompareItems } from "@/lib/compare-store";
import { distanceLine, googleDirectionsUrl, listingHref, type Origin } from "@/lib/directions";
import { formatInr, formatUpdatedAt } from "@/lib/format";
import { PG_TYPE_COLOR } from "@/lib/pg-type-colors";
import { cn } from "@/lib/utils";
import type { toPublicCard } from "@/modules/search";

type Card = ReturnType<typeof toPublicCard>;

function isAvailabilityFresh(date: Date | string) {
  const confirmed = new Date(date).getTime();
  const cutoff = Date.now() - STALE_AVAILABILITY_DAYS * 24 * 60 * 60 * 1000;
  return confirmed >= cutoff;
}

export function PgTypeBadge({ pgType }: { pgType: Card["pgType"] }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-ink/80">
      <span
        aria-hidden
        className="h-2.5 w-2.5 rounded-full"
        style={{ background: PG_TYPE_COLOR[pgType] }}
      />
      {PG_TYPE_LABEL[pgType]}
    </span>
  );
}

export function PgCard({
  property,
  variant = "stack",
  origin,
  compare = false,
}: {
  property: Card;
  variant?: "stack" | "rail";
  /** Preferred location; enables the distance line and Directions link. */
  origin?: Origin | null;
  compare?: boolean;
}) {
  const [photoBroken, setPhotoBroken] = useState(false);
  const photo = photoBroken ? undefined : property.photos[0]?.url;
  const sharing = property.roomTypes[0]?.sharingType;
  const rent = property.roomTypes[0]?.rent ?? property.minRent;
  const full = property.availableBeds <= 0;
  const availabilityFresh = isAvailabilityFresh(property.availabilityConfirmedAt);
  const compareItems = useCompareItems();
  const inCompare = compareItems.some((item) => item.slug === property.slug);
  const distance = property.commute
    ? distanceLine({
        distanceKm: property.commute.distanceKm,
        minutes: property.commute.minutes,
        mode: property.commute.mode,
      })
    : null;

  return (
    <article
      className={cn(
        "group rounded-[18px] bg-white p-3 shadow-card",
        variant === "rail" && "w-[260px] shrink-0",
      )}
    >
      <Link
        href={listingHref(property.slug, origin)}
        className="block"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative aspect-[4/3] overflow-hidden rounded-[14px] bg-canvas">
          {photo ? (
            <Image
              src={photo}
              alt={property.photos[0]?.alt || property.name}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
              sizes={variant === "rail" ? "260px" : "(max-width: 768px) 100vw, 360px"}
              quality={70}
              onError={() => setPhotoBroken(true)}
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-1 text-muted-foreground">
              <ImageOff className="h-6 w-6" aria-hidden />
              <span className="text-xs">Photos coming soon</span>
            </div>
          )}
          {PUBLIC_VERIFIED_LEVELS.includes(property.verificationLevel) ? (
            <Badge variant="verified" className="absolute left-3 top-3">
              ✓ Verified
            </Badge>
          ) : null}
          {availabilityFresh && !full ? (
            <Badge className="absolute bottom-3 left-3 bg-white/95 text-ink">
              Availability confirmed {formatUpdatedAt(property.availabilityConfirmedAt)}
            </Badge>
          ) : null}
          <div className="absolute right-3 top-3 z-10" onClick={(e) => e.preventDefault()}>
            <SaveButton propertyId={property.id} />
          </div>
        </div>
        <div className="mt-3 space-y-1">
          <h3 className="font-semibold text-ink">{property.name}</h3>
          <p className="text-sm text-muted-foreground">
            {property.area.name}, {property.city.name}
          </p>
          <PgTypeBadge pgType={property.pgType} />
          <p className="text-sm font-semibold text-ink">
            {formatInr(rent)}/month
            {sharing ? ` · ${SHARING_LABEL[sharing].replace(" Sharing", "")}` : ""}
            {property.foodIncluded ? " · Food included" : ""}
          </p>
          {property.commute?.trueMonthlyCost ? (
            <p className="text-sm font-medium text-ink">
              True cost {formatInr(property.commute.trueMonthlyCost)}/month
              <span className="block font-normal text-muted-foreground">
                {`Rent + ${formatInr(property.commute.monthlyCommute ?? 0)} commute`}
                {property.commute.dailyCost != null
                  ? ` (${formatInr(property.commute.dailyCost)}/day)`
                  : ""}
              </span>
            </p>
          ) : null}
          {distance ? (
            <p className="text-sm font-medium text-primary">
              {distance}
              {property.commute?.cheapest ? " · cheapest" : ""}
              {property.commute?.fastest ? " · fastest" : ""}
              {origin?.label ? (
                <span className="font-normal text-muted-foreground"> from {origin.label}</span>
              ) : null}
            </p>
          ) : null}
          {property.ratingAvg > 0 ? (
            <p className="flex items-center gap-1 text-sm text-ink">
              <Star className="h-3.5 w-3.5 fill-ink text-ink" />
              {property.ratingAvg.toFixed(1)} · {property.reviewCount} reviews
            </p>
          ) : null}
          <p className="text-sm">
            {full ? (
              <span className="text-muted-foreground">Currently full</span>
            ) : (
              <span className="text-success">
                {property.availableBeds} beds · updated{" "}
                {formatUpdatedAt(property.availabilityConfirmedAt)}
              </span>
            )}
          </p>
        </div>
      </Link>

      {origin || compare ? (
        <div className="mt-3 flex items-center justify-between gap-2 border-t border-border pt-3">
          {origin ? (
            <a
              href={googleDirectionsUrl(origin, property)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
            >
              <Navigation className="h-4 w-4" />
              Directions
            </a>
          ) : (
            <span />
          )}
          {compare ? (
            <label
              onClick={(e) => e.stopPropagation()}
              className="inline-flex cursor-pointer items-center gap-2 text-sm font-medium text-ink"
            >
              <input
                type="checkbox"
                checked={inCompare}
                onChange={() => toggleCompare({ slug: property.slug, name: property.name })}
                className="h-4 w-4 accent-primary"
              />
              Compare
            </label>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}
