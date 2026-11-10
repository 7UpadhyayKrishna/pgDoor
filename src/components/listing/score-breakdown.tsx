import Link from "next/link";
import { Prisma } from "@prisma/client";

function asRecord(value: Prisma.JsonValue | null | undefined): Record<string, number> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, number>;
}

export function ScoreBreakdown({
  livability,
  livabilityBreakdown,
  safety,
  safetyBreakdown,
}: {
  livability: number | null;
  livabilityBreakdown: Prisma.JsonValue | null;
  safety: number | null;
  safetyBreakdown: Prisma.JsonValue | null;
}) {
  if (livability == null && safety == null) return null;
  const live = asRecord(livabilityBreakdown);
  const safe = asRecord(safetyBreakdown);
  return (
    <section className="mt-6 grid gap-3 sm:grid-cols-2">
      {livability != null ? (
        <div className="rounded-[18px] bg-white p-4 shadow-card">
          <p className="text-sm text-muted-foreground">Livability</p>
          <p className="text-2xl font-bold">{livability}/100</p>
          {live ? (
            <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
              {Object.entries(live).map(([key, value]) => (
                <li key={key} className="flex justify-between">
                  <span className="capitalize">{key}</span>
                  <span>{value}</span>
                </li>
              ))}
            </ul>
          ) : null}
          <Link href="/methodology" className="mt-2 inline-block text-xs underline">
            Methodology
          </Link>
        </div>
      ) : null}
      {safety != null ? (
        <div className="rounded-[18px] bg-white p-4 shadow-card">
          <p className="text-sm text-muted-foreground">Women&apos;s safety</p>
          <p className="text-2xl font-bold">{safety}/100</p>
          <p className="mt-1 text-xs text-muted-foreground">Indicative, not a guarantee.</p>
          {safe ? (
            <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
              {Object.entries(safe).map(([key, value]) => (
                <li key={key} className="flex justify-between">
                  <span className="capitalize">{key}</span>
                  <span>{value}</span>
                </li>
              ))}
            </ul>
          ) : null}
          <Link href="/methodology" className="mt-2 inline-block text-xs underline">
            How this is scored
          </Link>
        </div>
      ) : null}
    </section>
  );
}
