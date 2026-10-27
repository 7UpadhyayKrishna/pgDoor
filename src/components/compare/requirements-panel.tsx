"use client";

import type { PgType, RoomSharingType } from "@prisma/client";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  EMPTY_REQUIREMENTS,
  type HouseRuleNeed,
  type Requirements,
} from "@/lib/match-score";
import { cn } from "@/lib/utils";

const AMENITY_OPTIONS = [
  { slug: "ac", label: "AC" },
  { slug: "wifi", label: "Wi-Fi" },
  { slug: "attached-bathroom", label: "Attached bathroom" },
  { slug: "laundry", label: "Laundry" },
  { slug: "washing-machine", label: "Washing machine" },
  { slug: "housekeeping", label: "Housekeeping" },
  { slug: "power-backup", label: "Power backup" },
  { slug: "parking", label: "Parking" },
  { slug: "cctv", label: "CCTV" },
  { slug: "lift", label: "Lift" },
  { slug: "gym", label: "Gym" },
  { slug: "study-table", label: "Study table" },
];

const NEED_OPTIONS: { id: HouseRuleNeed; label: string }[] = [
  { id: "visitors", label: "Visitors allowed" },
  { id: "cooking", label: "Cooking allowed" },
  { id: "smoking", label: "Smoking allowed" },
  { id: "alcohol", label: "Alcohol allowed" },
];

const selectClass =
  "mt-2 flex h-11 w-full rounded-[12px] border border-input bg-white px-3 text-sm text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "rounded-full px-3 py-1.5 text-sm font-medium ring-1 transition-colors",
        active ? "bg-ink text-white ring-ink" : "bg-white text-ink ring-border hover:bg-canvas",
      )}
    >
      {children}
    </button>
  );
}

function toggle<T>(list: T[], value: T) {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

export function RequirementsPanel({
  value,
  onChange,
  hasLocation,
}: {
  value: Requirements;
  onChange: (update: (prev: Requirements) => Requirements) => void;
  hasLocation: boolean;
}) {
  const set = (patch: Partial<Requirements> | ((prev: Requirements) => Partial<Requirements>)) =>
    onChange((prev) => ({ ...prev, ...(typeof patch === "function" ? patch(prev) : patch) }));
  const count =
    [value.budgetMax, value.commuteMax, value.pgType, value.sharing, value.food || value.vegOnly, value.moveInBy]
      .filter(Boolean).length + (value.amenities.length ? 1 : 0) + (value.needs.length ? 1 : 0);

  return (
    <details open className="group rounded-[18px] bg-white p-5 shadow-card">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Your requirements</h2>
          <p className="text-sm text-muted-foreground">
            {count
              ? `${count} requirement${count === 1 ? "" : "s"} set. Scores update as you edit.`
              : "Set what matters to you to see how well each PG matches."}
          </p>
        </div>
        <span className="text-sm font-medium text-primary group-open:hidden">Edit</span>
        <span className="hidden text-sm font-medium text-primary group-open:inline">Hide</span>
      </summary>

      <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Label htmlFor="req-budget">Max budget (₹/month)</Label>
          <Input
            id="req-budget"
            type="number"
            inputMode="numeric"
            min={0}
            step={500}
            className="mt-2"
            placeholder="Any"
            value={value.budgetMax ?? ""}
            onChange={(e) => set({ budgetMax: Number(e.target.value) || undefined })}
          />
        </div>
        <div>
          <Label htmlFor="req-commute">Max commute</Label>
          <select
            id="req-commute"
            className={selectClass}
            value={value.commuteMax ?? ""}
            onChange={(e) => set({ commuteMax: Number(e.target.value) || undefined })}
          >
            <option value="">Any</option>
            {[15, 20, 30, 45, 60].map((m) => (
              <option key={m} value={m}>
                {m} min
              </option>
            ))}
          </select>
          {value.commuteMax && !hasLocation ? (
            <p className="mt-1 text-xs text-muted-foreground">
              Set a preferred location on search to score commute.
            </p>
          ) : null}
        </div>
        <div>
          <Label htmlFor="req-type">PG type</Label>
          <select
            id="req-type"
            className={selectClass}
            value={value.pgType ?? ""}
            onChange={(e) => set({ pgType: (e.target.value || undefined) as PgType | undefined })}
          >
            <option value="">Any</option>
            <option value="GIRLS">Girls PG</option>
            <option value="BOYS">Boys PG</option>
            <option value="UNISEX">Unisex / Co-living</option>
          </select>
        </div>
        <div>
          <Label htmlFor="req-sharing">Room sharing</Label>
          <select
            id="req-sharing"
            className={selectClass}
            value={value.sharing ?? ""}
            onChange={(e) =>
              set({ sharing: (e.target.value || undefined) as RoomSharingType | undefined })
            }
          >
            <option value="">Any</option>
            <option value="SINGLE">Single</option>
            <option value="DOUBLE">Double</option>
            <option value="TRIPLE">Triple</option>
            <option value="FOUR">Four</option>
          </select>
        </div>
        <div>
          <Label htmlFor="req-movein">Move in by</Label>
          <Input
            id="req-movein"
            type="date"
            className="mt-2"
            value={value.moveInBy ?? ""}
            onChange={(e) => set({ moveInBy: e.target.value || undefined })}
          />
        </div>
        <div className="sm:col-span-1 lg:col-span-3">
          <Label>Food</Label>
          <div className="mt-2 flex flex-wrap gap-2">
            <Chip
              active={Boolean(value.food)}
              onClick={() => set((prev) => ({ food: !prev.food || undefined }))}
            >
              Food included
            </Chip>
            <Chip
              active={Boolean(value.vegOnly)}
              onClick={() => set((prev) => ({ vegOnly: !prev.vegOnly || undefined }))}
            >
              Veg food
            </Chip>
          </div>
        </div>
        <div className="sm:col-span-2 lg:col-span-4">
          <Label>Must-have amenities</Label>
          <div className="mt-2 flex flex-wrap gap-2">
            {AMENITY_OPTIONS.map((a) => (
              <Chip
                key={a.slug}
                active={value.amenities.includes(a.slug)}
                onClick={() => set((prev) => ({ amenities: toggle(prev.amenities, a.slug) }))}
              >
                {a.label}
              </Chip>
            ))}
          </div>
        </div>
        <div className="sm:col-span-2 lg:col-span-4">
          <Label>House rules I need</Label>
          <div className="mt-2 flex flex-wrap gap-2">
            {NEED_OPTIONS.map((n) => (
              <Chip
                key={n.id}
                active={value.needs.includes(n.id)}
                onClick={() => set((prev) => ({ needs: toggle(prev.needs, n.id) }))}
              >
                {n.label}
              </Chip>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-5 flex justify-end">
        <button
          type="button"
          onClick={() => onChange(() => EMPTY_REQUIREMENTS)}
          className="text-sm font-medium text-muted-foreground hover:text-ink"
        >
          Clear all requirements
        </button>
      </div>
    </details>
  );
}
