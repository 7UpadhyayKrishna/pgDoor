"use client";

import { useState } from "react";
import { Flag } from "lucide-react";
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

type Reason = (typeof REASONS)[number][0];

export function ReportListing({ propertyId }: { propertyId: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<Reason | "">("");
  const [details, setDetails] = useState("");
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit() {
    setError("");
    if (!reason) {
      setError("Pick what's wrong with this listing.");
      return;
    }
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

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex min-h-11 items-center gap-1.5 text-sm text-muted-foreground hover:text-ink hover:underline"
      >
        <Flag className="h-4 w-4" aria-hidden />
        Report this PG
      </button>
    );
  }

  return (
    <div className="max-w-xl space-y-3 rounded-[18px] bg-white p-4 shadow-card">
      <p className="font-semibold text-ink">Report this PG</p>
      <div>
        <label className="text-sm font-medium text-ink" htmlFor="report-reason">
          What&apos;s wrong?
        </label>
        <select
          id="report-reason"
          className="mt-1 h-11 w-full rounded-xl border border-input bg-white px-3 text-sm"
          value={reason}
          onChange={(e) => setReason(e.target.value as Reason)}
        >
          <option value="" disabled>
            Choose a reason
          </option>
          {REASONS.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="text-sm font-medium text-ink" htmlFor="report-details">
          Tell us more{reason === "OTHER" ? " (required)" : " (optional)"}
        </label>
        <textarea
          id="report-details"
          className="mt-1 min-h-24 w-full rounded-xl border border-input px-3 py-2 text-sm"
          placeholder="What seems wrong with this listing?"
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          maxLength={2000}
        />
      </div>
      {error ? <p className="text-sm text-error">{error}</p> : null}
      <div className="flex gap-2">
        <Button type="button" onClick={submit} disabled={loading}>
          Send report
        </Button>
        <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
