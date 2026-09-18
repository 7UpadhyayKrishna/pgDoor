"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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

  async function send() {
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
    setStep("otp");
  }

  async function verify() {
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
            <Label>Mobile number</Label>
            <Input
              className="mt-2"
              placeholder="10-digit mobile"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <Button className="w-full" onClick={send} disabled={loading}>
            Send OTP
          </Button>
          <p className="text-xs text-muted-foreground">Dev OTP is 123456.</p>
        </>
      ) : (
        <>
          <div>
            <Label>OTP</Label>
            <Input className="mt-2" value={code} onChange={(e) => setCode(e.target.value)} />
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <Button className="w-full" onClick={verify} disabled={loading}>
            Verify
          </Button>
        </>
      )}
    </div>
  );
}
