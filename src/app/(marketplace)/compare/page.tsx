"use client";

import { useEffect, useState } from "react";
import { formatInr } from "@/lib/format";

type Card = {
  slug: string;
  name: string;
  minRent: number;
  minDeposit: number;
  ratingAvg: number;
  amenities: { slug: string }[];
};

export default function ComparePage() {
  const [rows, setRows] = useState<Card[]>([]);

  useEffect(() => {
    const slugs = JSON.parse(localStorage.getItem("pgdoor_compare") ?? "[]") as string[];
    Promise.all(
      slugs.slice(0, 3).map(async (slug) => {
        const res = await fetch(`/api/pgs/${slug}`);
        if (!res.ok) return null;
        const data = await res.json();
        return data.property as Card;
      }),
    ).then((items) => setRows(items.filter(Boolean) as Card[]));
  }, []);

  if (!rows.length) {
    return (
      <div className="container-pg py-16">
        <h1 className="text-2xl font-bold">Compare PGs</h1>
        <p className="mt-2 text-muted-foreground">
          Add up to 3 listing slugs to localStorage key pgdoor_compare, then refresh.
        </p>
      </div>
    );
  }

  const amenitySlugs = ["ac", "wifi", "food"];

  return (
    <div className="container-pg overflow-x-auto py-12">
      <h1 className="text-2xl font-bold">Compare</h1>
      <table className="mt-6 min-w-[40rem] w-full text-sm">
        <thead>
          <tr>
            <th />
            {rows.map((r) => (
              <th key={r.slug} className="p-3 text-left">
                {r.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="p-3">Rent</td>
            {rows.map((r) => (
              <td key={r.slug} className="p-3">
                {formatInr(r.minRent)}
              </td>
            ))}
          </tr>
          <tr>
            <td className="p-3">Deposit</td>
            {rows.map((r) => (
              <td key={r.slug} className="p-3">
                {formatInr(r.minDeposit)}
              </td>
            ))}
          </tr>
          <tr>
            <td className="p-3">Rating</td>
            {rows.map((r) => (
              <td key={r.slug} className="p-3">
                {r.ratingAvg.toFixed(1)}
              </td>
            ))}
          </tr>
          {amenitySlugs.map((slug) => (
            <tr key={slug}>
              <td className="p-3 capitalize">{slug}</td>
              {rows.map((r) => (
                <td key={r.slug} className="p-3">
                  {r.amenities.some((a) => a.slug === slug) ? "✓" : "✕"}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
