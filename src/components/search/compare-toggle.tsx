"use client";

import { useRouter } from "next/navigation";
import { COMPARE_LIMIT } from "@/lib/constants";

export function CompareToggle({ slug }: { slug: string }) {
  const router = useRouter();

  function add() {
    const current = JSON.parse(localStorage.getItem("pgdoor_compare") ?? "[]") as string[];
    const next = current.includes(slug)
      ? current.filter((s) => s !== slug)
      : [...current, slug].slice(-COMPARE_LIMIT);
    localStorage.setItem("pgdoor_compare", JSON.stringify(next));
    router.push("/compare");
  }

  return (
    <button type="button" onClick={add} className="text-xs font-medium text-primary">
      Compare
    </button>
  );
}
