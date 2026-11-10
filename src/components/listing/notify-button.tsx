"use client";

import { useEffect, useState } from "react";
import { Bell, BellOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function NotifyButton({ slug, className }: { slug: string; className?: string }) {
  const [watching, setWatching] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/pgs/${encodeURIComponent(slug)}/watch`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data) setWatching(Boolean(data.watching));
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [slug]);

  async function toggle() {
    if (pending) return;
    setPending(true);
    setError("");
    try {
      const res = await fetch(`/api/pgs/${encodeURIComponent(slug)}/watch`, {
        method: watching ? "DELETE" : "POST",
      });
      if (res.status === 401) {
        window.location.href = `/login?next=${encodeURIComponent(window.location.pathname)}`;
        return;
      }
      if (!res.ok) {
        setError("Couldn't update your alert. Try again.");
        return;
      }
      setWatching(!watching);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className={cn("min-w-0", className)}>
      <Button
        size="lg"
        className="w-full"
        variant={watching ? "outline" : "default"}
        onClick={toggle}
        disabled={pending}
        aria-pressed={watching}
      >
        {watching ? <BellOff className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
        {watching ? "We'll alert you" : "Notify me when a bed opens"}
      </Button>
      {error ? <p className="mt-1 text-xs text-error">{error}</p> : null}
    </div>
  );
}
