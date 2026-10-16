"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

const SLOTS = ["10:00", "11:30", "13:00", "15:00", "17:30"];

function localToday() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function slotIsPast(date: string, slot: string) {
  if (!date) return false;
  return new Date(`${date}T${slot}:00`).getTime() <= Date.now();
}

export function VisitSheet({
  propertyId,
  triggerClassName,
}: {
  propertyId: string;
  triggerClassName?: string;
}) {
  const today = useMemo(() => localToday(), []);
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState("");
  const [slot, setSlot] = useState("11:30");
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const availableSlots = SLOTS.filter((s) => !slotIsPast(date, s));

  async function confirm() {
    setLoading(true);
    setError("");
    if (!date) {
      setError("Pick a date");
      setLoading(false);
      return;
    }
    const scheduledAt = new Date(`${date}T${slot}:00`);
    if (scheduledAt.getTime() <= Date.now()) {
      setError("Visit must be in the future");
      setLoading(false);
      return;
    }
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
                min={today}
                className="mt-2 h-11 w-full rounded-[12px] border px-3 text-sm"
                value={date}
                onChange={(e) => {
                  const next = e.target.value;
                  setDate(next);
                  if (slotIsPast(next, slot)) {
                    const first = SLOTS.find((s) => !slotIsPast(next, s));
                    if (first) setSlot(first);
                  }
                }}
              />
            </div>
            <div>
              <p className="text-sm font-medium">Choose time</p>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {SLOTS.map((s) => {
                  const past = slotIsPast(date, s);
                  return (
                    <button
                      key={s}
                      type="button"
                      disabled={past}
                      onClick={() => setSlot(s)}
                      className={`min-h-11 rounded-xl border text-sm disabled:cursor-not-allowed disabled:opacity-40 ${
                        slot === s ? "border-primary bg-primary-soft" : "border-input"
                      }`}
                    >
                      {s}
                    </button>
                  );
                })}
              </div>
              {date && availableSlots.length === 0 ? (
                <p className="mt-2 text-sm text-muted-foreground">No remaining slots today. Pick another date.</p>
              ) : null}
            </div>
            {error ? <p className="text-sm text-error">{error}</p> : null}
            <Button
              className="w-full"
              onClick={confirm}
              disabled={loading || !date || availableSlots.length === 0}
            >
              Confirm visit
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
