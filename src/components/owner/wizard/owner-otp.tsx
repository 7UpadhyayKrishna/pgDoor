"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, textInputClass } from "./fields";

export function OwnerOtp({
  onVerified,
  submitLabel,
  busy,
}: {
  onVerified: () => void | Promise<void>;
  submitLabel: string;
  busy?: boolean;
}) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [devHint, setDevHint] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function send() {
    if (name.trim().length < 2) {
      setError("Enter your name");
      return;
    }
    if (!/^[6-9]\d{9}$/.test(phone)) {
      setError("Enter a valid 10-digit mobile number");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/otp/send", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ phone, purpose: "OWNER_REGISTER" }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not send OTP");
        return;
      }
      setDevHint(Boolean(data.dev));
      setStep("otp");
    } catch {
      setError("Could not send OTP. Check your internet connection.");
    } finally {
      setLoading(false);
    }
  }

  async function verify() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ phone, code, purpose: "OWNER_REGISTER", name: name.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Invalid OTP");
        return;
      }
      await onVerified();
    } catch {
      setError("Could not verify OTP. Check your internet connection.");
    } finally {
      setLoading(false);
    }
  }

  if (step === "phone") {
    return (
      <div className="space-y-4">
        <Field label="Your name" htmlFor="owner-name">
          <input
            id="owner-name"
            className={textInputClass}
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </Field>
        <Field label="Mobile number" hint="We'll send a one-time code to verify it's you" htmlFor="owner-phone">
          <div className="flex h-12 items-center rounded-[12px] border border-input bg-white px-3 focus-within:ring-2 focus-within:ring-ring">
            <span className="mr-2 text-base text-muted-foreground">+91</span>
            <input
              id="owner-phone"
              type="tel"
              inputMode="numeric"
              autoComplete="tel-national"
              className="min-w-0 flex-1 bg-transparent text-base outline-none"
              value={phone}
              maxLength={10}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
            />
          </div>
        </Field>
        {error ? (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        ) : null}
        <Button type="button" size="lg" className="w-full" onClick={send} disabled={loading}>
          {loading ? "Sending…" : "Send OTP"}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Field label={`Enter the OTP sent to +91 ${phone}`} htmlFor="owner-otp">
        <input
          id="owner-otp"
          inputMode="numeric"
          autoComplete="one-time-code"
          className={`${textInputClass} text-center text-lg tracking-[0.4em]`}
          value={code}
          maxLength={6}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
        />
      </Field>
      {devHint ? <p className="text-xs text-muted-foreground">Dev OTP is 123456.</p> : null}
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
      <Button
        type="button"
        size="lg"
        className="w-full"
        onClick={verify}
        disabled={loading || busy || code.length < 4}
      >
        {loading || busy ? "Please wait…" : submitLabel}
      </Button>
      <div className="flex justify-between text-sm">
        <button type="button" className="min-h-11 font-medium text-ink/70 underline" onClick={() => setStep("phone")}>
          Change number
        </button>
        <button type="button" className="min-h-11 font-medium text-ink/70 underline" onClick={send} disabled={loading}>
          Resend OTP
        </button>
      </div>
    </div>
  );
}
