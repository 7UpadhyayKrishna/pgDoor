import { formatDistanceToNow } from "date-fns";

export function formatInr(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

/** A missing deposit is unknown, not free. */
export function formatDeposit(amount: number | null | undefined) {
  if (amount == null) return "Ask owner";
  if (amount === 0) return "No deposit";
  return formatInr(amount);
}

/** Lowest known deposit; null when no room has one. */
export function minKnownDeposit(values: (number | null | undefined)[]) {
  const known = values.filter((v): v is number => v != null);
  return known.length ? Math.min(...known) : null;
}

/** "22:30" -> "10:30 PM"; empty means no curfew. */
export function formatGateTime(value: string | null | undefined) {
  if (!value) return "No restriction";
  const [h, m] = value.split(":").map(Number);
  if (Number.isNaN(h)) return value;
  const suffix = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${hour}${m ? `:${String(m).padStart(2, "0")}` : ""} ${suffix}`;
}

export function formatUpdatedAt(date: Date | string) {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}
