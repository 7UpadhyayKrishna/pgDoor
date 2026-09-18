import { Suspense } from "react";
import { PhoneLogin } from "@/components/auth/phone-login";

export default function LoginPage() {
  return (
    <div className="container-pg flex min-h-[70vh] items-center justify-center py-16">
      <div className="w-full max-w-md rounded-[24px] bg-white p-6 shadow-card">
        <h1 className="text-2xl font-bold">Login</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Search freely. Sign in with OTP when you save or enquire.
        </p>
        <div className="mt-6">
          <Suspense>
            <PhoneLogin />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
