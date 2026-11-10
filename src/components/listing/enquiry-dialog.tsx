"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ChatSheet } from "@/components/listing/chat-sheet";
import { MOVE_IN_LABEL } from "@/lib/constants";

const WINDOWS = ["IMMEDIATE", "WITHIN_7_DAYS", "THIS_MONTH", "LATER"] as const;
const ROOMS = ["SINGLE", "DOUBLE", "TRIPLE"] as const;

function whatsAppUrl(phone: string, propertyName?: string) {
  const digits = phone.replace(/\D/g, "");
  const text = propertyName
    ? `Hi, I found ${propertyName} on pgDoor and sent an enquiry. Is a bed available?`
    : "Hi, I found your PG on pgDoor and sent an enquiry. Is a bed available?";
  return `https://wa.me/${digits.length === 10 ? `91${digits}` : digits}?text=${encodeURIComponent(text)}`;
}

export function EnquirySheet({
  propertyId,
  triggerClassName,
  triggerVariant = "outline" as const,
  propertyName,
}: {
  propertyId: string;
  triggerClassName?: string;
  triggerVariant?: "outline" | "default";
  propertyName?: string;
}) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"form" | "otp" | "done">("form");
  const [moveInWindow, setMoveInWindow] = useState<(typeof WINDOWS)[number]>("WITHIN_7_DAYS");
  const [roomPreference, setRoomPreference] = useState<string>("");
  const [budget, setBudget] = useState("");
  const [message, setMessage] = useState("");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [leadId, setLeadId] = useState<string | null>(null);
  const [ownerContact, setOwnerContact] = useState<{ name: string | null; phone: string } | null>(null);
  const [chatOpen, setChatOpen] = useState(false);

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
        message: message.trim() || undefined,
      }),
    });
    const data = await lead.json();
    setLoading(false);
    if (!lead.ok) {
      setError(data.error ?? "Could not send enquiry");
      return;
    }
    setLeadId(data.lead?.id ?? null);
    setOwnerContact(data.lead?.ownerContact ?? null);
    setStep("done");
  }

  return (
    <>
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
                <Input
                  className="mt-2"
                  inputMode="numeric"
                  placeholder="₹"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                />
              </div>
              <div>
                <Label>Message to owner (optional)</Label>
                <textarea
                  className="mt-2 min-h-24 w-full rounded-xl border px-3 py-2 text-sm"
                  placeholder="Ask about availability, food, or visit timings…"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  maxLength={2000}
                />
              </div>
              <div>
                <Label>Phone</Label>
                <Input
                  className="mt-2"
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  placeholder="10-digit mobile"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  After a quick OTP you&apos;ll get the owner&apos;s WhatsApp and phone number.
                </p>
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
              <Input
                value={code}
                inputMode="numeric"
                autoComplete="one-time-code"
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                placeholder="OTP"
              />
              {error ? <p className="text-sm text-error">{error}</p> : null}
              <Button className="w-full" onClick={verifyAndSend} disabled={loading}>
                Verify & send
              </Button>
            </div>
          ) : null}
          {step === "done" ? (
            <div className="mt-4 space-y-3">
              <p className="text-sm text-muted-foreground">
                The owner will see your enquiry. You can chat with them on pgDoor now.
              </p>
              {ownerContact ? (
                <div className="grid grid-cols-2 gap-2">
                  <Button asChild variant="outline">
                    <a
                      href={whatsAppUrl(ownerContact.phone, propertyName)}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      WhatsApp owner
                    </a>
                  </Button>
                  <Button asChild variant="outline">
                    <a href={`tel:${ownerContact.phone}`}>Call owner</a>
                  </Button>
                </div>
              ) : null}
              {leadId ? (
                <Button
                  className="w-full"
                  onClick={() => {
                    setOpen(false);
                    setChatOpen(true);
                  }}
                >
                  Chat with owner
                </Button>
              ) : null}
              <Button className="w-full" variant="outline" onClick={() => setOpen(false)}>
                Done
              </Button>
            </div>
          ) : null}
        </SheetContent>
      </Sheet>
      {leadId ? (
        <ChatSheet
          leadId={leadId}
          open={chatOpen}
          onOpenChange={setChatOpen}
          title="Chat with owner"
        />
      ) : null}
    </>
  );
}
