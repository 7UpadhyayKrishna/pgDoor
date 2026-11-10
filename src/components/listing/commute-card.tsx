import Link from "next/link";
import { MODE_LABEL, type CommuteMode } from "@/lib/commute/modes";
import { formatInr } from "@/lib/format";
import { googleDirectionsUrl } from "@/lib/directions";
import type { ModeQuote, PropertyCommute } from "@/modules/commute";
import { Badge } from "@/components/ui/badge";

function age(iso: Date | string) {
  const ms = Date.now() - new Date(iso).getTime();
  const hours = Math.max(1, Math.round(ms / 3600000));
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

export function CommuteCard({
  profile,
  destLabel,
  destLat,
  destLng,
  rent,
  property,
}: {
  profile: PropertyCommute;
  destLabel?: string;
  destLat: number;
  destLng: number;
  rent: number;
  property: { latitude: number; longitude: number };
}) {
  const selected = profile.selected;
  return (
    <section className="mt-4 rounded-[18px] bg-primary-soft p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">
            Commute to {destLabel ?? "your destination"}
          </p>
          <p className="mt-1 text-lg font-bold text-ink">
            {formatInr(rent)} rent + {formatInr(selected.monthlyCost)} commute ={" "}
            {formatInr(profile.trueMonthlyCost)}
            <span className="text-sm font-medium text-muted-foreground"> / month</span>
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Data {age(selected.computedAt)}
            {selected.approximate ? " · approximate" : ""}
            {selected.estimate ? " · fare estimate" : ""}
          </p>
        </div>
        <a
          href={googleDirectionsUrl(
            { lat: destLat, lng: destLng, label: destLabel, mode: selected.mode },
            property,
          )}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-semibold text-primary hover:underline"
        >
          Directions
        </a>
      </div>

      <ul className="mt-4 grid gap-2 sm:grid-cols-2">
        {profile.quotes.map((quote) => (
          <QuoteRow
            key={quote.mode}
            quote={quote}
            cheapest={quote.mode === profile.cheapest.mode}
            fastest={quote.mode === profile.fastest.mode}
            recommended={quote.mode === profile.recommended.mode}
          />
        ))}
      </ul>
      <p className="mt-3 text-xs text-muted-foreground">
        Default 22 commute days.{" "}
        <Link href="/methodology" className="underline">
          How we calculate this
        </Link>
      </p>
    </section>
  );
}

function QuoteRow({
  quote,
  cheapest,
  fastest,
  recommended,
}: {
  quote: ModeQuote;
  cheapest: boolean;
  fastest: boolean;
  recommended: boolean;
}) {
  return (
    <li className="rounded-xl bg-white px-3 py-2.5 text-sm shadow-card">
      <div className="flex items-center justify-between gap-2">
        <p className="font-semibold text-ink">{MODE_LABEL[quote.mode as CommuteMode] ?? quote.mode}</p>
        <p className="font-medium">{quote.minutes} min</p>
      </div>
      <p className="text-muted-foreground">
        {formatInr(quote.dailyCost)}/day · {formatInr(quote.monthlyCost)}/mo
      </p>
      <div className="mt-1 flex flex-wrap gap-1">
        {cheapest ? <Badge>Cheapest</Badge> : null}
        {fastest ? <Badge variant="verified">Fastest</Badge> : null}
        {recommended ? <Badge>Recommended</Badge> : null}
      </div>
    </li>
  );
}
