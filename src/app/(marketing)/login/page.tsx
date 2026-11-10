import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { LoginMethods } from "@/components/auth/login-methods";

export const metadata: Metadata = {
  title: "Log in",
  description: "Log in to pgDoor with your mobile number to save PGs, enquire and book visits.",
  robots: { index: false, follow: true },
};

export default function LoginPage() {
  return (
    <div className="container-pg flex min-h-[70vh] items-center justify-center py-16">
      <div className="w-full max-w-md rounded-[24px] bg-white p-6 shadow-card">
        <h1 className="text-2xl font-bold">Log in</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Search freely. Sign in with OTP when you save or enquire.
        </p>
        <div className="mt-6">
          <Suspense>
            <LoginMethods />
          </Suspense>
        </div>
        <p className="mt-6 border-t border-border pt-4 text-sm text-muted-foreground">
          New here? Tenants just enter a mobile number above.{" "}
          <Link href="/owners/register" className="font-medium text-primary hover:underline">
            PG owner? List your PG for free
          </Link>
        </p>
      </div>
    </div>
  );
}
