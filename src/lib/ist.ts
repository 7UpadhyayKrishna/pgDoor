/** India has no DST, so a fixed offset is exact. Servers (Vercel) run in UTC. */
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
const TIME_ZONE = "Asia/Kolkata";

export function startOfIstDay(date = new Date()) {
  const shifted = new Date(date.getTime() + IST_OFFSET_MS);
  shifted.setUTCHours(0, 0, 0, 0);
  return new Date(shifted.getTime() - IST_OFFSET_MS);
}

export function endOfIstDay(date = new Date()) {
  return new Date(startOfIstDay(date).getTime() + 24 * 60 * 60 * 1000 - 1);
}

/** Parses a `<input type="datetime-local">` value as India time. */
export function parseIstDateTimeLocal(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return null;
  const date = new Date(`${value}:00+05:30`);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Formats a date as a `datetime-local` value in India time. */
export function toIstDateTimeLocal(date: Date) {
  return new Date(date.getTime() + IST_OFFSET_MS).toISOString().slice(0, 16);
}

export function formatIst(date: Date, style: "date" | "datetime" = "datetime") {
  return date.toLocaleString("en-IN", {
    timeZone: TIME_ZONE,
    day: "numeric",
    month: "short",
    ...(style === "datetime" ? { hour: "numeric", minute: "2-digit" } : {}),
  });
}
