"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Alert = { id: string; title: string; body: string; createdAt: string; readAt: string | null };
type Search = { id: string; name: string | null; maxMin: number | null; maxCost: number | null };

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [searches, setSearches] = useState<Search[]>([]);

  useEffect(() => {
    fetch("/api/alerts")
      .then((r) => r.json())
      .then((data) => {
        setAlerts(data.alerts ?? []);
        setSearches(data.searches ?? []);
      })
      .catch(() => undefined);
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold">Saved searches and alerts</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        In-app alerts when a new PG matches a destination you saved. WhatsApp comes later.
      </p>
      <section className="mt-6">
        <h2 className="font-semibold">Saved searches</h2>
        {searches.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">
            Save a search from the map after you pick a destination.{" "}
            <Link href="/pgs" className="underline">
              Find PGs
            </Link>
          </p>
        ) : (
          <ul className="mt-2 space-y-2">
            {searches.map((s) => (
              <li key={s.id} className="rounded-xl bg-white px-4 py-3 text-sm shadow-card">
                {s.name} {s.maxMin ? `· ≤ ${s.maxMin} min` : ""} {s.maxCost ? `· ≤ ₹${s.maxCost}/day` : ""}
              </li>
            ))}
          </ul>
        )}
      </section>
      <section className="mt-8">
        <h2 className="font-semibold">Alerts</h2>
        <ul className="mt-2 space-y-2">
          {alerts.map((a) => (
            <li key={a.id} className="rounded-xl bg-white px-4 py-3 text-sm shadow-card">
              <p className="font-medium">{a.title}</p>
              <p className="text-muted-foreground">{a.body}</p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
