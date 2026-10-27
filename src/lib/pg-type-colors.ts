import type { PgType } from "@prisma/client";

const PINK = "#ec4899";
const BLUE = "#2563eb";
const GREEN = "#16a34a";

/** Co-living is mixed-gender, so it shares the unisex colour. */
export const PG_TYPE_COLOR: Record<PgType, string> = {
  GIRLS: PINK,
  BOYS: BLUE,
  UNISEX: GREEN,
  CO_LIVING: GREEN,
};

export const PG_TYPE_LEGEND = [
  { label: "Girls", color: PINK },
  { label: "Boys", color: BLUE },
  { label: "Unisex / Co-living", color: GREEN },
];
