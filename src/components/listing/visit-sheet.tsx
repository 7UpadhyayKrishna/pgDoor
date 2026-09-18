"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

const SLOTS = ["10:00", "11:30", "13:00", "15:00", "17:30"];

export function VisitSheet({
  propertyId,
  triggerClassName,
}: {
  propertyId: string;
  triggerClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState("");
  const [slot, setSlot] = useState("11:30");
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function confirm() {
    setLoading(true);
    setError("");
    const scheduledAt = new Date(`${date}T${slot}:00`);
    const res = await fetch("/api/visits", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ propertyId, scheduledAt: scheduledAt.toISOString() }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      if (res.status === 401) {
        window.location.href = `/login?next=${encodeURIComponent(window.location.pathname)}`;
        return;
      }
      setError(data.error ?? "Could not request visit");
      return;
    }
    setDone(true);
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) {
          setDone(false);
          setError("");
        }
      }}
    >
      <SheetTrigger asChild>
        <Button className={triggerClassName} size="lg">
          Book visit
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetTitle>{done ? "Visit requested successfully." : "Book a visit"}</SheetTitle>
        {done ? (
          <p className="mt-3 text-sm text-muted-foreground">The owner will confirm your slot shortly.</p>
        ) : (
          <div className="mt-4 space-y-4">
            <div>
              <p className="text-sm font-medium">Choose date</p>
              <input
                type="date"
                className="mt-2 h-11 w-full rounded-[12px] border px-3 text-sm"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div>
              <p className="text-sm font-medium">Choose time</p>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {SLOTS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSlot(s)}
                    className={`min-h-11 rounded-xl border text-sm ${
                      slot === s ? "border-primary bg-primary-soft" : "border-input"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
            {error ? <p className="text-sm text-error">{error}</p> : null}
            <Button className="w-full" onClick={confirm} disabled={loading || !date}>
              Confirm visit
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
