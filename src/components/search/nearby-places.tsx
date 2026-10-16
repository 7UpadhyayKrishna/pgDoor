import { Star } from "lucide-react";
import type { NearbyCategory, NearbyPlace } from "@/lib/places";

const CATEGORY_LABELS: Record<NearbyCategory, string> = {
  cafes: "Cafes",
  restaurants: "Restaurants",
  shopping: "Shopping",
  attractions: "Attractions",
  hangouts: "Hangouts",
};

const CATEGORY_ORDER: NearbyCategory[] = [
  "cafes",
  "restaurants",
  "shopping",
  "attractions",
  "hangouts",
];

export function NearbyPlaces({
  areaName,
  places,
}: {
  areaName: string;
  places: NearbyPlace[];
}) {
  if (!places.length) return null;

  const grouped = CATEGORY_ORDER.map((category) => ({
    category,
    label: CATEGORY_LABELS[category],
    items: places.filter((p) => p.category === category),
  })).filter((g) => g.items.length > 0);

  if (!grouped.length) return null;

  return (
    <section className="rounded-[20px] bg-white px-4 py-5 shadow-card sm:px-5">
      <h2 className="text-lg font-semibold text-ink">Popular nearby</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Must-visit spots near {areaName}
      </p>

      <div className="mt-5 space-y-5">
        {grouped.map((group) => (
          <div key={group.category}>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {group.label}
            </h3>
            <ul className="mt-2 divide-y divide-border">
              {group.items.map((place) => (
                <li key={place.placeId}>
                  <a
                    href={place.mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-start justify-between gap-3 py-2.5 text-sm hover:text-primary"
                  >
                    <span className="min-w-0">
                      <span className="font-medium text-ink">{place.name}</span>
                      {place.vicinity ? (
                        <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                          {place.vicinity}
                        </span>
                      ) : null}
                    </span>
                    {place.rating != null ? (
                      <span className="flex shrink-0 items-center gap-1 text-xs font-medium text-ink">
                        <Star className="h-3.5 w-3.5 fill-ink" />
                        {place.rating.toFixed(1)}
                        {place.userRatingsTotal != null ? (
                          <span className="text-muted-foreground">
                            ({place.userRatingsTotal})
                          </span>
                        ) : null}
                      </span>
                    ) : null}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
