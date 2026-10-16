"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

const REASONS = [
  ["WRONG_PRICE", "Wrong price"],
  ["NOT_AVAILABLE", "Not available"],
  ["FAKE_PHOTOS", "Fake photos"],
  ["WRONG_LOCATION", "Wrong location"],
  ["OWNER_ISSUE", "Owner issue"],
  ["DUPLICATE_LISTING", "Duplicate listing"],
  ["OTHER", "Other"],
] as const;

export function ReportListing({ propertyId }: { propertyId: string }) {
  const [reason, setReason] = useState<(typeof REASONS)[number][0]>("WRONG_PRICE");
  const [details, setDetails] = useState("");
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit() {
    setError("");
    if (reason === "OTHER" && details.trim().length < 10) {
      setError("Please describe the issue (at least 10 characters).");
      return;
    }
    setLoading(true);
    const res = await fetch("/api/reports", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        propertyId,
        reason,
        details: details.trim() || undefined,
      }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Could not submit report");
      return;
    }
    setSent(true);
  }

  if (sent) {
    return <p className="text-sm text-muted-foreground">Thanks. We’ll review this listing.</p>;
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <select
          className="h-10 rounded-xl border px-3 text-sm"
          value={reason}
          onChange={(e) => setReason(e.target.value as typeof reason)}
        >
          {REASONS.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <Button type="button" variant="outline" size="sm" onClick={submit} disabled={loading}>
          Report this PG
        </Button>
      </div>
      <div>
        <label className="text-sm font-medium text-ink" htmlFor="report-details">
          Tell us more{reason === "OTHER" ? " (required)" : " (optional)"}
        </label>
        <textarea
          id="report-details"
          className="mt-1 min-h-24 w-full max-w-xl rounded-xl border px-3 py-2 text-sm"
          placeholder="What seems wrong with this listing?"
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          maxLength={2000}
        />
      </div>
      {error ? <p className="text-sm text-error">{error}</p> : null}
    </div>
  );
}
