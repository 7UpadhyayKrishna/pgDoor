export const COMMUTE_BANDS = [
  { max: 20, color: "#16a34a", label: "≤ 20 min" },
  { max: 40, color: "#d97706", label: "21–40 min" },
  { max: Infinity, color: "#dc2626", label: "> 40 min" },
] as const;

export function commuteBandColor(minutes: number | null | undefined) {
  if (minutes == null) return "#64748b";
  return COMMUTE_BANDS.find((band) => minutes <= band.max)?.color ?? "#dc2626";
}
