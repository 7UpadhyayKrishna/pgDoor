"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AlertTriangle, Check, Minus, Navigation, Star, Trash2, X } from "lucide-react";
import { RequirementsPanel } from "@/components/compare/requirements-panel";
import { PgTypeBadge } from "@/components/search/pg-card";
import { Button } from "@/components/ui/button";
import { removeCompare, useCompareItems } from "@/lib/compare-store";
import { MEAL_LABEL, SHARING_LABEL, VERIFICATION_LABEL } from "@/lib/constants";
import { distanceLine, googleDirectionsUrl, listingHref, type Origin } from "@/lib/directions";
import { formatGateTime, formatInr } from "@/lib/format";
import {
  DEALBREAKER_CAP,
  EMPTY_REQUIREMENTS,
  requirementsFromParams,
  sanitizeRequirements,
  scoreMatch,
  type ComparePg,
  type MatchItem,
  type MatchKey,
  type MatchResult,
  type MatchStatus,
  type Requirements,
} from "@/lib/match-score";
import { usePreferredLocation } from "@/lib/preferred-location";
import { cn } from "@/lib/utils";

const REQUIREMENTS_KEY = "pgdoor_requirements";

const STATUS_STYLE: Record<MatchStatus, { chip: string; icon: typeof Check; label: string }> = {
  match: { chip: "bg-emerald-50 text-emerald-800", icon: Check, label: "Matches" },
  partial: { chip: "bg-amber-50 text-amber-800", icon: Minus, label: "Partly" },
  miss: { chip: "bg-red-50 text-red-700", icon: X, label: "Missing" },
};

function scoreColor(score: number) {
  if (score >= 75) return "#16a34a";
  if (score >= 50) return "#d97706";
  return "#dc2626";
}

function ScoreRing({ score }: { score: number | null }) {
  const radius = 34;
  const circumference = 2 * Math.PI * radius;
  const value = score ?? 0;
  return (
    <div className="relative h-24 w-24 shrink-0">
      <svg viewBox="0 0 80 80" className="h-full w-full -rotate-90" aria-hidden>
        <circle cx="40" cy="40" r={radius} fill="none" stroke="#eef0f2" strokeWidth="8" />
        {score != null ? (
          <circle
            cx="40"
            cy="40"
            r={radius}
            fill="none"
            stroke={scoreColor(value)}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - value / 100)}
          />
        ) : null}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-ink">{score != null ? `${score}%` : "–"}</span>
        <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
          match
        </span>
      </div>
    </div>
  );
}

function StatusIcon({ status }: { status: MatchStatus }) {
  const { icon: Icon, label } = STATUS_STYLE[status];
  return (
    <span
      title={label}
      className={cn(
        "inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full",
        STATUS_STYLE[status].chip,
      )}
    >
      <Icon className="h-3 w-3" aria-label={label} />
    </span>
  );
}

function ItemChips({ items, status }: { items: MatchItem[]; status: MatchStatus }) {
  const filtered = items.filter((i) => i.status === status);
  if (!filtered.length) return null;
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {STATUS_STYLE[status].label}
      </p>
      <ul className="mt-1.5 flex flex-wrap gap-1.5">
        {filtered.map((i) => (
          <li
            key={i.key}
            title={i.detail}
            className={cn("rounded-full px-2.5 py-1 text-xs font-medium", STATUS_STYLE[status].chip)}
          >
            {i.label}
          </li>
        ))}
      </ul>
    </div>
  );
}

function loadRequirements(params: URLSearchParams): Requirements {
  let saved = EMPTY_REQUIREMENTS;
  try {
    saved = sanitizeRequirements(JSON.parse(localStorage.getItem(REQUIREMENTS_KEY) ?? "{}"));
  } catch {
    // ignore corrupt storage
  }
  return { ...saved, ...requirementsFromParams(params) };
}

export function CompareView() {
  const params = useSearchParams();
  const items = useCompareItems();
  const saved = usePreferredLocation();
  const [requirements, setRequirements] = useState<Requirements>(EMPTY_REQUIREMENTS);
  const [data, setData] = useState<ComparePg[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setRequirements(loadRequirements(new URLSearchParams(params.toString())));
  }, [params]);

  function updateRequirements(update: (prev: Requirements) => Requirements) {
    setRequirements((prev) => {
      const next = update(prev);
      localStorage.setItem(REQUIREMENTS_KEY, JSON.stringify(next));
      return next;
    });
  }

  const origin: Origin | null = useMemo(() => {
    const lat = Number(params.get("destLat"));
    const lng = Number(params.get("destLng"));
    if (params.get("destLat") && params.get("destLng") && Number.isFinite(lat) && Number.isFinite(lng)) {
      return {
        lat,
        lng,
        label: params.get("destLabel") ?? undefined,
        mode: params.get("mode") ?? undefined,
      };
    }
    return saved ? { lat: saved.lat, lng: saved.lng, label: saved.label } : null;
  }, [params, saved]);

  const slugKey = items.map((i) => i.slug).join(",");

  useEffect(() => {
    if (!slugKey) {
      setData([]);
      return;
    }
    const qs = new URLSearchParams({ slugs: slugKey });
    if (origin) {
      qs.set("destLat", String(origin.lat));
      qs.set("destLng", String(origin.lng));
      if (origin.mode) qs.set("mode", origin.mode);
    }
    let cancelled = false;
    setLoading(true);
    setError("");
    fetch(`/api/compare?${qs.toString()}`)
      .then(async (res) => {
        const body = await res.json();
        if (!res.ok) throw new Error(body.error ?? "Could not load PGs");
        if (!cancelled) setData(body.properties as ComparePg[]);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [slugKey, origin]);

  const results = useMemo(
    () => data.map((pg) => ({ pg, match: scoreMatch(pg, requirements) })),
    [data, requirements],
  );

  const bestSlug = useMemo(() => {
    if (results.length < 2) return null;
    const [a, b] = results;
    if (a.match.score == null || b.match.score == null || a.match.score === b.match.score) return null;
    return a.match.score > b.match.score ? a.pg.slug : b.pg.slug;
  }, [results]);

  const backToSearch = params.toString() ? `/pgs?${params.toString()}` : "/pgs";

  if (items.length === 0) {
    return (
      <div className="rounded-[24px] bg-white p-8 text-center shadow-card">
        <h2 className="text-lg font-semibold">No PGs selected yet</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Tick &ldquo;Compare&rdquo; on any 2 listings in search to see them side by side with a match score.
        </p>
        <Button asChild className="mt-4">
          <Link href={backToSearch}>Find PGs to compare</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <RequirementsPanel
        value={requirements}
        onChange={updateRequirements}
        hasLocation={Boolean(origin)}
      />

      {error ? (
        <p className="rounded-[14px] bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      ) : null}

      <div className="grid grid-cols-2 gap-3 sm:gap-5">
        {results.map(({ pg, match }) => (
          <PgColumn
            key={pg.slug}
            pg={pg}
            match={match}
            best={bestSlug === pg.slug}
            origin={origin}
          />
        ))}
        {results.length < 2 && !loading ? (
          <div className="flex flex-col items-center justify-center rounded-[18px] border-2 border-dashed border-border p-6 text-center">
            <p className="text-sm font-medium">Pick one more PG</p>
            <Button asChild variant="outline" size="sm" className="mt-3">
              <Link href={backToSearch}>Back to search</Link>
            </Button>
          </div>
        ) : null}
        {loading && results.length === 0 ? (
          <p className="col-span-2 text-center text-sm text-muted-foreground">Loading PGs...</p>
        ) : null}
      </div>

      {results.length ? <CompareTable results={results} origin={origin} /> : null}
    </div>
  );
}

function PgColumn({
  pg,
  match,
  best,
  origin,
}: {
  pg: ComparePg;
  match: MatchResult;
  best: boolean;
  origin: Origin | null;
}) {
  return (
    <article
      className={cn(
        "flex min-w-0 flex-col rounded-[18px] bg-white p-3 shadow-card sm:p-4",
        best && "ring-2 ring-primary",
      )}
    >
      <div className="relative aspect-[4/3] overflow-hidden rounded-[14px] bg-canvas">
        {pg.photo ? (
          <Image src={pg.photo} alt={pg.name} fill className="object-cover" sizes="(max-width: 640px) 50vw, 400px" />
        ) : null}
        {best ? (
          <span className="absolute left-2 top-2 rounded-full bg-primary px-2.5 py-1 text-xs font-semibold text-white">
            Best match
          </span>
        ) : null}
      </div>
      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <Link href={listingHref(pg.slug, origin)} className="font-semibold text-ink hover:underline">
            {pg.name}
          </Link>
          <p className="text-sm text-muted-foreground">
            {pg.areaName}, {pg.cityName}
          </p>
          <PgTypeBadge pgType={pg.pgType} />
        </div>
        <ScoreRing score={match.score} />
      </div>

      {match.dealbreaker ? (
        <p className="mt-3 flex items-start gap-1.5 rounded-[12px] bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          Dealbreaker: {match.items.find((i) => i.dealbreaker)?.detail}. Score capped at {DEALBREAKER_CAP}%.
        </p>
      ) : null}

      <div className="mb-4 mt-3 space-y-3">
        {match.score == null ? (
          <p className="text-sm text-muted-foreground">Set requirements above to see the match.</p>
        ) : (
          <>
            <ItemChips items={match.items} status="match" />
            <ItemChips items={match.items} status="partial" />
            <ItemChips items={match.items} status="miss" />
          </>
        )}
      </div>

      <div className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3">
        {origin ? (
          <a
            href={googleDirectionsUrl(origin, pg)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
          >
            <Navigation className="h-4 w-4" /> Directions
          </a>
        ) : (
          <span />
        )}
        <button
          type="button"
          onClick={() => removeCompare(pg.slug)}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-ink"
        >
          <Trash2 className="h-4 w-4" /> Remove
        </button>
      </div>
    </article>
  );
}

type Row = { label: string; key?: MatchKey; render: (pg: ComparePg) => ReactNode };

function yesNo(value: boolean) {
  return value ? "Yes" : "No";
}

function CompareTable({
  results,
  origin,
}: {
  results: { pg: ComparePg; match: MatchResult }[];
  origin: Origin | null;
}) {
  const rows: Row[] = [
    { label: "Rent from", key: "budget", render: (pg) => `${formatInr(pg.minRent)}/mo` },
    {
      label: "Deposit",
      render: (pg) =>
        `${formatInr(pg.minDeposit)}${pg.maintenanceCharge ? ` · ${formatInr(pg.maintenanceCharge)} maintenance` : ""}`,
    },
    {
      label: "Sharing options",
      key: "sharing",
      render: (pg) =>
        pg.roomTypes.length ? (
          <ul className="space-y-0.5">
            {pg.roomTypes.map((rt) => (
              <li key={rt.sharingType}>
                {SHARING_LABEL[rt.sharingType].replace(" Sharing", "")}: {formatInr(rt.rent)}
                <span className="text-muted-foreground">
                  {" "}
                  · {rt.availableBeds > 0 ? `${rt.availableBeds} free` : "full"}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          "Not listed"
        ),
    },
    {
      label: origin?.label ? `Distance from ${origin.label}` : "Distance",
      key: "commute",
      render: (pg) =>
        pg.commute
          ? distanceLine({ distanceKm: pg.commute.distanceKm, minutes: pg.commute.minutes, mode: pg.commute.mode })
          : "Set a preferred location on search",
    },
    { label: "PG type", key: "pgType", render: (pg) => <PgTypeBadge pgType={pg.pgType} /> },
    {
      label: "Food",
      key: "food",
      render: (pg) =>
        pg.foodIncluded
          ? [
              pg.mealsProvided.map((m) => MEAL_LABEL[m] ?? m).join(", ") || "Included",
              [pg.vegetarianFood && "Veg", pg.nonVegetarianFood && "Non-veg"].filter(Boolean).join(" & "),
            ]
              .filter(Boolean)
              .join(" · ")
          : "Not included",
    },
    {
      label: "Amenities",
      key: "amenities",
      render: (pg) => (pg.amenities.length ? pg.amenities.map((a) => a.name).join(", ") : "None listed"),
    },
    {
      label: "House rules",
      key: "rules",
      render: (pg) => (
        <ul className="space-y-0.5">
          <li>Visitors: {yesNo(pg.visitorsAllowed)}</li>
          <li>Cooking: {yesNo(pg.cookingAllowed)}</li>
          <li>Smoking: {yesNo(pg.smokingAllowed)}</li>
          <li>Alcohol: {yesNo(pg.alcoholAllowed)}</li>
          <li>Gate closes: {formatGateTime(pg.gateClosingTime)}</li>
        </ul>
      ),
    },
    {
      label: "Availability",
      key: "moveIn",
      render: (pg) =>
        pg.availableBeds > 0
          ? `${pg.availableBeds} of ${pg.totalBeds} beds free${
              pg.moveInFrom ? ` · from ${new Date(pg.moveInFrom).toLocaleDateString("en-IN")}` : ""
            }`
          : "Currently full",
    },
    {
      label: "Notice / lock-in",
      render: (pg) =>
        `${pg.noticePeriodDays ? `${pg.noticePeriodDays} days` : "No"} notice · ${
          pg.lockInMonths ? `${pg.lockInMonths} months` : "no"
        } lock-in`,
    },
    {
      label: "Rating",
      render: (pg) =>
        pg.ratingAvg > 0 ? (
          <span className="inline-flex items-center gap-1">
            <Star className="h-3.5 w-3.5 fill-ink" /> {pg.ratingAvg.toFixed(1)} ({pg.reviewCount})
          </span>
        ) : (
          "No reviews yet"
        ),
    },
    {
      label: "Verification",
      render: (pg) => VERIFICATION_LABEL[pg.verificationLevel] ?? pg.verificationLevel,
    },
  ];

  return (
    <div className="overflow-x-auto rounded-[18px] bg-white shadow-card">
      <table className="w-full min-w-[36rem] text-sm">
        <thead>
          <tr className="border-b border-border text-left">
            <th className="w-40 p-4 font-medium text-muted-foreground">Side by side</th>
            {results.map(({ pg }) => (
              <th key={pg.slug} className="p-4 font-semibold text-ink">
                {pg.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.label} className="border-b border-border align-top last:border-0">
              <th scope="row" className="p-4 text-left font-medium text-muted-foreground">
                {row.label}
              </th>
              {results.map(({ pg, match }) => {
                const item = row.key ? match.items.find((i) => i.key === row.key) : undefined;
                return (
                  <td key={pg.slug} className="p-4 text-ink">
                    <div className="flex items-start gap-2">
                      {item ? <StatusIcon status={item.status} /> : null}
                      <div className="min-w-0">
                        {row.render(pg)}
                        {item ? (
                          <p className="mt-0.5 text-xs text-muted-foreground">{item.detail}</p>
                        ) : null}
                      </div>
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
