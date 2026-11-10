import type { ModeQuote } from "@/modules/commute";

export function CommuteTrial({ quote, destLabel }: { quote: ModeQuote; destLabel?: string }) {
  const leave = Math.max(0, 9 * 60 + 30 - quote.minutes);
  const hh = String(Math.floor(leave / 60)).padStart(2, "0");
  const mm = String(leave % 60).padStart(2, "0");
  const legs = Array.isArray(quote.legs)
    ? (quote.legs as { instruction?: string; minutes?: number; mode?: string }[])
    : [];
  return (
    <section className="mt-4 rounded-[18px] bg-white p-4 shadow-card">
      <h2 className="text-sm font-semibold text-ink">Sample commute day</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Leave the PG at {hh}:{mm}, reach {destLabel ?? "your destination"} at 9:30.
      </p>
      <ol className="mt-3 space-y-2 text-sm">
        {legs.length ? (
          legs.map((leg, i) => (
            <li key={i} className="flex gap-2">
              <span className="font-medium text-ink">{i + 1}.</span>
              <span>
                {leg.instruction ?? leg.mode} {leg.minutes ? `(${leg.minutes} min)` : ""}
              </span>
            </li>
          ))
        ) : (
          <li>
            Travel about {quote.minutes} min by {quote.mode.replace("_", " ")} ({quote.km.toFixed(1)} km).
          </li>
        )}
      </ol>
    </section>
  );
}
