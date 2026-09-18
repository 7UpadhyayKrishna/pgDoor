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
  const [sent, setSent] = useState(false);

  async function submit() {
    await fetch("/api/reports", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ propertyId, reason }),
    });
    setSent(true);
  }

  if (sent) {
    return <p className="text-sm text-muted-foreground">Thanks. We’ll review this listing.</p>;
  }

  return (
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
      <Button type="button" variant="outline" size="sm" onClick={submit}>
        Report this PG
      </Button>
    </div>
  );
}
