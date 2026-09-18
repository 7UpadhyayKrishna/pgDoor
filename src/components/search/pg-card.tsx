"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Heart, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { SHARING_LABEL } from "@/lib/constants";
import { formatInr, formatUpdatedAt } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { toPublicCard } from "@/modules/search";

type Card = ReturnType<typeof toPublicCard>;

export function PgCard({
  property,
  variant = "stack",
}: {
  property: Card;
  variant?: "stack" | "rail";
}) {
  const photo = property.photos[0]?.url;
  const sharing = property.roomTypes[0]?.sharingType;
  const [saved, setSaved] = useState(false);
  const full = property.availableBeds <= 0;

  return (
    <article className={cn("group", variant === "rail" && "w-[260px] shrink-0")}>
      <Link href={`/pg/${property.slug}`} className="block">
        <div className="relative aspect-[4/3] overflow-hidden rounded-[18px] bg-canvas">
          {photo ? (
            <Image
              src={photo}
              alt={property.name}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
              sizes={variant === "rail" ? "260px" : "(max-width: 768px) 100vw, 360px"}
            />
          ) : null}
          {property.verificationLevel !== "UNVERIFIED" ? (
            <Badge variant="verified" className="absolute left-3 top-3">
              ✓ Verified
            </Badge>
          ) : null}
          <button
            type="button"
            aria-label="Save"
            onClick={(e) => {
              e.preventDefault();
              setSaved((v) => !v);
              fetch("/api/saved", {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ propertyId: property.id }),
              }).catch(() => undefined);
            }}
            className="absolute right-3 top-3 flex h-11 w-11 items-center justify-center rounded-full bg-white/95 shadow-card"
          >
            <Heart
              className={cn("h-5 w-5", saved ? "fill-primary text-primary" : "text-ink")}
            />
          </button>
        </div>
        <div className="mt-3 space-y-1">
          <h3 className="font-semibold text-ink">{property.name}</h3>
          <p className="text-sm text-muted-foreground">
            {property.area.name}, {property.city.name}
          </p>
          <p className="text-sm font-semibold text-ink">
            {formatInr(property.minRent)}/month
            {sharing ? ` · ${SHARING_LABEL[sharing].replace(" Sharing", "")}` : ""}
          </p>
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
                {property.availableBeds} beds · updated {formatUpdatedAt(property.availabilityConfirmedAt)}
              </span>
            )}
          </p>
        </div>
      </Link>
    </article>
  );
}
