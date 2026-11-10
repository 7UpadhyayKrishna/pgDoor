import type { CommuteSlot } from "@/lib/commute/modes";

const IST = "+05:30";

function pad(n: number) {
  return String(n).padStart(2, "0");
}

/** Next weekday (Mon–Fri) at the given IST clock time, as RFC3339. */
export function nextWeekdayAt(hours: number, minutes: number, from = new Date()) {
  const utc = new Date(from.getTime());
  const istMs = utc.getTime() + 5.5 * 60 * 60 * 1000;
  const ist = new Date(istMs);
  const year = ist.getUTCFullYear();
  const month = ist.getUTCMonth();
  const day = ist.getUTCDate();
  const candidate = new Date(Date.UTC(year, month, day, hours, minutes, 0) - 5.5 * 60 * 60 * 1000);
  let cursor = candidate.getTime() <= from.getTime() ? candidate.getTime() + 86400000 : candidate.getTime();
  for (let i = 0; i < 8; i += 1) {
    const local = new Date(cursor + 5.5 * 60 * 60 * 1000);
    const dow = local.getUTCDay();
    if (dow !== 0 && dow !== 6) {
      const y = local.getUTCFullYear();
      const m = pad(local.getUTCMonth() + 1);
      const d = pad(local.getUTCDate());
      return `${y}-${m}-${d}T${pad(hours)}:${pad(minutes)}:00${IST}`;
    }
    cursor += 86400000;
  }
  return `${ist.getUTCFullYear()}-${pad(ist.getUTCMonth() + 1)}-${pad(ist.getUTCDate())}T${pad(hours)}:${pad(minutes)}:00${IST}`;
}

export function departureTimeForSlot(slot: CommuteSlot, arrivalTime = "09:30") {
  if (slot === "offpeak") return nextWeekdayAt(13, 0);
  const [h, m] = arrivalTime.split(":").map(Number);
  const leaveH = Number.isFinite(h) ? Math.max(0, h - 1) : 8;
  const leaveM = Number.isFinite(m) ? m : 30;
  return nextWeekdayAt(leaveH, leaveM);
}

export function parseArrivalTime(raw?: string) {
  if (raw && /^\d{2}:\d{2}$/.test(raw)) return raw;
  return "09:30";
}
