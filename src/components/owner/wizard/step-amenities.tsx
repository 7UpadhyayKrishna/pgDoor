"use client";

import {
  AirVent,
  ArrowUpDown,
  Bath,
  Bed,
  BookOpen,
  Car,
  Cctv,
  Cigarette,
  CookingPot,
  DoorOpen,
  Droplets,
  Dumbbell,
  Flame,
  Refrigerator,
  ShieldCheck,
  Shirt,
  Sparkles,
  Tv,
  Users,
  Utensils,
  WashingMachine,
  Wifi,
  Wine,
  Wrench,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { Chip, Field, ToggleRow, textInputClass } from "./fields";
import type { StepProps } from "./step-basics";

export type WizardAmenity = { slug: string; name: string; group: string };

const AMENITY_ICONS: Record<string, LucideIcon> = {
  ac: AirVent,
  bed: Bed,
  mattress: Bed,
  wardrobe: Shirt,
  "attached-bathroom": Bath,
  "attached-balcony": DoorOpen,
  "study-table": BookOpen,
  geyser: Flame,
  tv: Tv,
  fridge: Refrigerator,
  wifi: Wifi,
  "ro-water": Droplets,
  gym: Dumbbell,
  "security-guard": ShieldCheck,
  cctv: Cctv,
  lift: ArrowUpDown,
  parking: Car,
  "power-backup": Zap,
  "washing-machine": WashingMachine,
  food: Utensils,
  laundry: Shirt,
  housekeeping: Sparkles,
  maintenance: Wrench,
};

const GROUPS = [
  { key: "ROOM", title: "In the room" },
  { key: "PROPERTY", title: "In the building" },
  { key: "SERVICES", title: "Services" },
];

const GATE_TIMES = [
  { value: "", label: "No restriction" },
  { value: "21:00", label: "9 PM" },
  { value: "22:00", label: "10 PM" },
  { value: "23:00", label: "11 PM" },
];

export function StepAmenities({
  draft,
  update,
  amenities,
}: StepProps & { amenities: WizardAmenity[] }) {
  function toggle(slug: string) {
    update({
      amenitySlugs: draft.amenitySlugs.includes(slug)
        ? draft.amenitySlugs.filter((s) => s !== slug)
        : [...draft.amenitySlugs, slug],
    });
  }

  const customGate = draft.gateClosingTime && !GATE_TIMES.some((g) => g.value === draft.gateClosingTime);

  return (
    <div className="space-y-6">
      {GROUPS.map((group) => {
        const items = amenities.filter((a) => a.group === group.key);
        if (!items.length) return null;
        return (
          <section key={group.key}>
            <h3 className="text-base font-semibold text-ink">{group.title}</h3>
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {items.map((amenity) => {
                const Icon = AMENITY_ICONS[amenity.slug] ?? Sparkles;
                return (
                  <Chip
                    key={amenity.slug}
                    role="checkbox"
                    selected={draft.amenitySlugs.includes(amenity.slug)}
                    icon={<Icon className="h-4 w-4" />}
                    onClick={() => toggle(amenity.slug)}
                  >
                    {amenity.name}
                  </Chip>
                );
              })}
            </div>
          </section>
        );
      })}

      <Field label="Anything else?" optional hint="Other facilities, separated by commas" htmlFor="other-amenities">
        <input
          id="other-amenities"
          className={textInputClass}
          maxLength={500}
          placeholder="e.g. Terrace, microwave, water cooler"
          value={draft.otherAmenities}
          onChange={(e) => update({ otherAmenities: e.target.value })}
        />
      </Field>

      <section className="space-y-3">
        <h3 className="text-base font-semibold text-ink">House rules</h3>
        <div className="grid gap-2 sm:grid-cols-2">
          <ToggleRow
            label="Visitors allowed"
            icon={<Users className="h-5 w-5" />}
            checked={draft.visitorsAllowed}
            onChange={(visitorsAllowed) => update({ visitorsAllowed })}
          />
          <ToggleRow
            label="Cooking allowed"
            icon={<CookingPot className="h-5 w-5" />}
            checked={draft.cookingAllowed}
            onChange={(cookingAllowed) => update({ cookingAllowed })}
          />
          <ToggleRow
            label="Smoking allowed"
            icon={<Cigarette className="h-5 w-5" />}
            checked={draft.smokingAllowed}
            onChange={(smokingAllowed) => update({ smokingAllowed })}
          />
          <ToggleRow
            label="Alcohol allowed"
            icon={<Wine className="h-5 w-5" />}
            checked={draft.alcoholAllowed}
            onChange={(alcoholAllowed) => update({ alcoholAllowed })}
          />
        </div>
        <Field label="Gate closing time">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
            {GATE_TIMES.map((gate) => (
              <Chip
                key={gate.label}
                role="radio"
                selected={draft.gateClosingTime === gate.value}
                onClick={() => update({ gateClosingTime: gate.value })}
              >
                {gate.label}
              </Chip>
            ))}
            <label className="flex min-h-12 items-center rounded-[12px] border border-border bg-white px-3 text-sm">
              <span className="sr-only">Other time</span>
              <input
                type="time"
                className={`w-full bg-transparent outline-none ${customGate ? "font-semibold" : "text-muted-foreground"}`}
                value={customGate ? draft.gateClosingTime : ""}
                onChange={(e) => update({ gateClosingTime: e.target.value })}
              />
            </label>
          </div>
        </Field>
      </section>
    </div>
  );
}
