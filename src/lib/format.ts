import { formatDistanceToNow } from "date-fns";

export function formatInr(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatUpdatedAt(date: Date | string) {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}
