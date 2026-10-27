"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function ExitTestingButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function exit() {
    setLoading(true);
    await fetch("/api/testing/access", { method: "DELETE" });
    setLoading(false);
    router.refresh();
  }

  return (
    <Button variant="outline" onClick={exit} disabled={loading}>
      {loading ? "Exiting..." : "Exit testing mode"}
    </Button>
  );
}
