"use client";

import { useState } from "react";
import { PhoneLogin } from "@/components/auth/phone-login";
import { PasswordLogin } from "@/components/auth/password-login";
import { cn } from "@/lib/utils";

const METHODS = [
  { id: "otp", label: "OTP" },
  { id: "password", label: "Password" },
] as const;

export function LoginMethods() {
  const [method, setMethod] = useState<(typeof METHODS)[number]["id"]>("otp");
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 rounded-xl bg-canvas p-1 text-sm font-medium">
        {METHODS.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => setMethod(m.id)}
            className={cn(
              "rounded-lg py-2 transition-colors",
              method === m.id ? "bg-white text-ink shadow-sm" : "text-muted-foreground hover:text-ink",
            )}
          >
            {m.label}
          </button>
        ))}
      </div>
      {method === "otp" ? <PhoneLogin /> : <PasswordLogin />}
    </div>
  );
}
