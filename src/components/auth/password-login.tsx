"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function PasswordLogin({ redirectTo }: { redirectTo?: string }) {
  const router = useRouter();
  const params = useSearchParams();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!/^[6-9]\d{9}$/.test(phone)) {
      setError("Enter a valid 10-digit mobile number");
      return;
    }
    setLoading(true);
    setError("");
    const res = await fetch("/api/auth/password/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ phone, password }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "Could not sign in");
      return;
    }
    const fallback = data.role === "OWNER" ? "/owners/dashboard" : data.role === "ADMIN" ? "/admin" : "/";
    const next = redirectTo ?? params.get("next") ?? fallback;
    router.push(
      data.mustChangePassword ? `/owners/change-password?next=${encodeURIComponent(next)}` : next,
    );
    router.refresh();
  }

  return (
    <form className="space-y-4" onSubmit={submit}>
      <div>
        <Label htmlFor="pwd-phone">Mobile number</Label>
        <Input
          id="pwd-phone"
          className="mt-2"
          type="tel"
          inputMode="numeric"
          maxLength={10}
          placeholder="10-digit mobile"
          autoComplete="username"
          value={phone}
          onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
        />
      </div>
      <div>
        <Label htmlFor="pwd-password">Password</Label>
        <Input
          id="pwd-password"
          className="mt-2"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <Button className="w-full" type="submit" disabled={loading}>
        Sign in
      </Button>
      <p className="text-xs text-muted-foreground">
        PG owners: use the mobile number and password shared by the pgDoor team.
      </p>
    </form>
  );
}
