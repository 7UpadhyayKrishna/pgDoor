"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { MOVE_IN_LABEL } from "@/lib/constants";

const WINDOWS = ["IMMEDIATE", "WITHIN_7_DAYS", "THIS_MONTH", "LATER"] as const;
const ROOMS = ["SINGLE", "DOUBLE", "TRIPLE"] as const;

export function EnquirySheet({
  propertyId,
  triggerClassName,
  triggerVariant = "outline" as const,
}: {
  propertyId: string;
  triggerClassName?: string;
  triggerVariant?: "outline" | "default";
}) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"form" | "otp" | "done">("form");
  const [moveInWindow, setMoveInWindow] = useState<(typeof WINDOWS)[number]>("WITHIN_7_DAYS");
  const [roomPreference, setRoomPreference] = useState<string>("");
  const [budget, setBudget] = useState("");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function sendOtp() {
    setLoading(true);
    setError("");
    const res = await fetch("/api/auth/otp/send", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ phone, purpose: "ENQUIRY" }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "Could not send OTP");
      return;
    }
    setStep("otp");
  }

  async function verifyAndSend() {
    setLoading(true);
    setError("");
    const verify = await fetch("/api/auth/otp/verify", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ phone, code, purpose: "ENQUIRY" }),
    });
    if (!verify.ok) {
      const data = await verify.json();
      setLoading(false);
      setError(data.error ?? "Invalid OTP");
      return;
    }
    const lead = await fetch("/api/leads", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        propertyId,
        moveInWindow,
        roomPreference: roomPreference || undefined,
        budget: budget ? Number(budget) : undefined,
      }),
    });
    const data = await lead.json();
    setLoading(false);
    if (!lead.ok) {
      setError(data.error ?? "Could not send enquiry");
      return;
    }
    setStep("done");
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) {
          setStep("form");
          setError("");
        }
      }}
    >
      <SheetTrigger asChild>
        <Button variant={triggerVariant} className={triggerClassName} size="lg">
          Talk to the owner
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetTitle>
          {step === "done" ? "Enquiry sent!" : "Interested in this PG?"}
        </SheetTitle>
        {step === "form" ? (
          <div className="mt-4 space-y-4">
            <div>
              <Label>When do you want to move?</Label>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {WINDOWS.map((w) => (
                  <button
                    key={w}
                    type="button"
                    onClick={() => setMoveInWindow(w)}
                    className={`min-h-11 rounded-xl border px-3 text-sm ${
                      moveInWindow === w ? "border-primary bg-primary-soft" : "border-input"
                    }`}
                  >
                    {MOVE_IN_LABEL[w]}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label>Room preference</Label>
              <div className="mt-2 flex gap-2">
                {ROOMS.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRoomPreference(r)}
                    className={`min-h-11 flex-1 rounded-xl border px-2 text-sm ${
                      roomPreference === r ? "border-primary bg-primary-soft" : "border-input"
                    }`}
                  >
                    {r[0] + r.slice(1).toLowerCase()}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label>Budget</Label>
              <Input className="mt-2" inputMode="numeric" placeholder="₹" value={budget} onChange={(e) => setBudget(e.target.value)} />
            </div>
            <div>
              <Label>Phone</Label>
              <Input className="mt-2" placeholder="+91" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            {error ? <p className="text-sm text-error">{error}</p> : null}
            <Button className="w-full" onClick={sendOtp} disabled={loading || phone.length < 10}>
              Ask about this PG
            </Button>
          </div>
        ) : null}
        {step === "otp" ? (
          <div className="mt-4 space-y-3">
            <p className="text-sm text-muted-foreground">Enter the OTP sent to {phone}.</p>
            <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="OTP" />
            {error ? <p className="text-sm text-error">{error}</p> : null}
            <Button className="w-full" onClick={verifyAndSend} disabled={loading}>
              Verify & send
            </Button>
          </div>
        ) : null}
        {step === "done" ? (
          <div className="mt-4 space-y-3">
            <p className="text-sm text-muted-foreground">The owner will contact you shortly.</p>
            <Button className="w-full" onClick={() => setOpen(false)}>
              Done
            </Button>
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
