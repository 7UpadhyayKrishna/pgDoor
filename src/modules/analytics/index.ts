export const AnalyticsEvent = {
  search: "search",
  pg_view: "pg_view",
  save: "save",
  compare: "compare",
  contact: "contact",
  whatsapp: "whatsapp",
  call: "call",
  visit: "visit",
} as const;

export type AnalyticsEventName =
  (typeof AnalyticsEvent)[keyof typeof AnalyticsEvent];

export async function track(
  event: AnalyticsEventName,
  payload: Record<string, unknown> = {},
) {
  if (process.env.NODE_ENV === "development") {
    console.info(`[analytics] ${event}`, payload);
  }
}
