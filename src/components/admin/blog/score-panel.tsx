"use client";

import { useState } from "react";
import { CheckCircle2, CircleAlert, XCircle } from "lucide-react";
import type { CheckGroup, PostScore } from "@/modules/blog/seo-score";
import { cn } from "@/lib/utils";

const GROUP_LABEL: Record<CheckGroup, string> = { seo: "SEO", aeo: "AEO", geo: "GEO" };
const GROUP_HINT: Record<CheckGroup, string> = {
  seo: "Ranking in Google search",
  aeo: "Featured snippets, voice and People Also Ask",
  geo: "Being cited by ChatGPT, Perplexity, Gemini and AI Overviews",
};

function tone(value: number) {
  return value >= 80 ? "text-success" : value >= 50 ? "text-warning" : "text-error";
}

function Ring({ value, label }: { value: number; label: string }) {
  const r = 22;
  const c = 2 * Math.PI * r;
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="relative block h-14 w-14">
      <svg viewBox="0 0 56 56" className="h-14 w-14 -rotate-90" aria-hidden>
        <circle cx="28" cy="28" r={r} fill="none" strokeWidth="6" className="stroke-canvas" />
        <circle
          cx="28"
          cy="28"
          r={r}
          fill="none"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c - (value / 100) * c}
          className={cn("stroke-current transition-[stroke-dashoffset]", tone(value))}
        />
      </svg>
      <span className={cn("absolute inset-0 flex items-center justify-center text-sm font-bold tabular-nums", tone(value))}>
        {value}
      </span>
      </span>
      <span className="text-xs font-semibold text-ink">{label}</span>
    </div>
  );
}

export function ScorePanel({ score, onJump }: { score: PostScore; onJump: (field: string) => void }) {
  const [group, setGroup] = useState<CheckGroup>("seo");
  const checks = score.checks
    .filter((c) => c.group === group)
    .sort((a, b) => ["fail", "warn", "pass"].indexOf(a.status) - ["fail", "warn", "pass"].indexOf(b.status));
  return (
    <div className="rounded-[18px] bg-white p-4 shadow-card">
      <div className="flex items-baseline justify-between">
        <p className="font-semibold text-ink">Optimisation score</p>
        <p className={cn("text-2xl font-bold tabular-nums", tone(score.total))}>{score.total}</p>
      </div>
      <div className="mt-3 grid grid-cols-3">
        {(["seo", "aeo", "geo"] as const).map((g) => (
          <button key={g} type="button" onClick={() => setGroup(g)} className={cn("rounded-xl py-1", group === g && "bg-canvas")}>
            <Ring value={score[g]} label={GROUP_LABEL[g]} />
          </button>
        ))}
      </div>
      <p className="mt-2 text-xs text-muted-foreground">{GROUP_HINT[group]}</p>
      <ul className="mt-3 max-h-[46vh] space-y-1 overflow-auto pr-1">
        {checks.map((check) => {
          const Icon = check.status === "pass" ? CheckCircle2 : check.status === "warn" ? CircleAlert : XCircle;
          return (
            <li key={check.id}>
              <button
                type="button"
                onClick={() => onJump(check.field)}
                className="flex w-full gap-2 rounded-lg px-2 py-1.5 text-left hover:bg-canvas"
              >
                <Icon
                  className={cn(
                    "mt-0.5 h-4 w-4 shrink-0",
                    check.status === "pass" ? "text-success" : check.status === "warn" ? "text-warning" : "text-error",
                  )}
                />
                <span className="min-w-0">
                  <span className="block text-sm font-medium text-ink">{check.label}</span>
                  <span className="block text-xs text-muted-foreground">{check.message}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
