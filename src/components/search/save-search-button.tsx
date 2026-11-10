"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";

export function SaveSearchButton() {
  const params = useSearchParams();
  const [status, setStatus] = useState("");
  const destLat = Number(params.get("destLat"));
  const destLng = Number(params.get("destLng"));
  if (!Number.isFinite(destLat) || !Number.isFinite(destLng)) return null;

  async function save() {
    const res = await fetch("/api/alerts", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        destLat,
        destLng,
        destLabel: params.get("destLabel"),
        maxMin: Number(params.get("commuteMax")) || undefined,
        maxCost: Number(params.get("maxDailyCost")) || undefined,
      }),
    });
    setStatus(res.ok ? "Search saved" : "Sign in to save this search");
  }

  return (
    <div className="flex items-center gap-2">
      <button type="button" onClick={save} className="text-sm font-semibold text-primary hover:underline">
        Save this search
      </button>
      {status ? <span className="text-xs text-muted-foreground">{status}</span> : null}
    </div>
  );
}
