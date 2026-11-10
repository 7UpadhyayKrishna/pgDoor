"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

const LINES = ["Yellow", "Rapid Metro", "Blue", "Aqua"];

export function MetroLinePicker() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const line = params.get("metroLine") ?? "";

  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground">Metro line</p>
      <select
        value={line}
        onChange={(e) => {
          const next = new URLSearchParams(params.toString());
          if (!e.target.value) next.delete("metroLine");
          else next.set("metroLine", e.target.value);
          if (e.target.value === "Rapid Metro") next.set("mode", "rapid_metro");
          if (e.target.value === "Yellow" || e.target.value === "Blue" || e.target.value === "Aqua") {
            next.set("mode", "metro");
          }
          router.push(`${pathname}?${next.toString()}`);
        }}
        className="mt-1 h-11 w-full rounded-xl border border-input bg-white px-3 text-sm"
      >
        <option value="">Any line</option>
        {LINES.map((l) => (
          <option key={l} value={l}>
            {l}
          </option>
        ))}
      </select>
    </div>
  );
}
