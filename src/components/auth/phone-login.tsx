"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const PHONE_ERROR = "Enter a valid 10-digit mobile number";

export function PhoneLogin({
  purpose = "LOGIN",
  redirectTo,
}: {
  purpose?: "LOGIN" | "OWNER_REGISTER";
  redirectTo?: string;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const next = redirectTo ?? params.get("next") ?? (purpose === "OWNER_REGISTER" ? "/owners/dashboard" : "/");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [devHint, setDevHint] = useState(false);

  async function send() {
    if (!/^[6-9]\d{9}$/.test(phone)) {
      setError(PHONE_ERROR);
      return;
    }
    setLoading(true);
    setError("");
    const res = await fetch("/api/auth/otp/send", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ phone, purpose }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "Could not send OTP");
      return;
    }
    setDevHint(Boolean(data.dev));
    setStep("otp");
  }

  async function verify() {
    if (!/^\d{4,8}$/.test(code)) {
      setError("Enter the code we sent by SMS");
      return;
    }
    setLoading(true);
    setError("");
    const res = await fetch("/api/auth/otp/verify", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ phone, code, purpose, name: name || undefined }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "Invalid OTP");
      return;
    }
    router.push(next);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      {step === "phone" ? (
        <>
          {purpose === "OWNER_REGISTER" ? (
            <div>
              <Label>Your name</Label>
              <Input className="mt-2" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
          ) : null}
          <div>
            <Label htmlFor="login-phone">Mobile number</Label>
            <div className="mt-2 flex items-center rounded-[12px] border border-input bg-white focus-within:ring-2 focus-within:ring-ring">
              <span className="pl-3 pr-1 text-sm text-muted-foreground">+91</span>
              <Input
                id="login-phone"
                className="border-0 shadow-none focus-visible:ring-0"
                type="tel"
                inputMode="numeric"
                autoComplete="tel-national"
                maxLength={10}
                placeholder="10-digit mobile"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                onKeyDown={(e) => {
                  if (e.key === "Enter") send();
                }}
              />
            </div>
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <Button className="w-full" onClick={send} disabled={loading}>
            Send OTP
          </Button>
        </>
      ) : (
        <>
          <div>
            <Label htmlFor="login-otp">OTP sent to +91 {phone}</Label>
            <Input
              id="login-otp"
              className="mt-2"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={8}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              onKeyDown={(e) => {
                if (e.key === "Enter") verify();
              }}
            />
          </div>
          {devHint ? <p className="text-xs text-muted-foreground">Dev OTP is 123456.</p> : null}
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <Button className="w-full" onClick={verify} disabled={loading}>
            Verify
          </Button>
          <button
            type="button"
            className="w-full text-sm text-muted-foreground underline-offset-4 hover:underline"
            onClick={() => {
              setStep("phone");
              setCode("");
              setError("");
            }}
          >
            Change number
          </button>
        </>
      )}
    </div>
  );
}
