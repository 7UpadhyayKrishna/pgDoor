"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Clears the session, then refreshes server components so the header drops the signed-in state at once. */
export function LogoutButton({
  variant = "outline",
  size = "default",
  showIcon = false,
}: {
  variant?: "outline" | "ghost";
  size?: "default" | "sm";
  showIcon?: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function logout() {
    setPending(true);
    try {
      await fetch("/api/auth/logout", { method: "POST", headers: { accept: "application/json" } });
    } finally {
      router.replace("/");
      router.refresh();
    }
  }

  return (
    <Button type="button" variant={variant} size={size} onClick={logout} disabled={pending}>
      {showIcon ? <LogOut className="h-4 w-4" /> : null}
      {pending ? "Logging out…" : "Logout"}
    </Button>
  );
}
