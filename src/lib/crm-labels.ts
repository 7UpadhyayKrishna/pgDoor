import type { ProspectActivityType, ProspectSource, ProspectStage } from "@prisma/client";

export const PROSPECT_STAGES: ProspectStage[] = [
  "NEW",
  "CONTACTED",
  "INTERESTED",
  "VISIT_SCHEDULED",
  "LISTED",
  "ONBOARDED",
  "LOST",
];

/** Stages where the prospect still needs work from the team. */
export const OPEN_STAGES: ProspectStage[] = ["NEW", "CONTACTED", "INTERESTED", "VISIT_SCHEDULED"];

export const STAGE_LABEL: Record<ProspectStage, string> = {
  NEW: "New",
  CONTACTED: "Contacted",
  INTERESTED: "Interested",
  VISIT_SCHEDULED: "Visit scheduled",
  LISTED: "Listed",
  ONBOARDED: "Onboarded",
  LOST: "Lost",
};

export const SOURCE_LABEL: Record<ProspectSource, string> = {
  FIELD_VISIT: "Field visit",
  REFERRAL: "Referral",
  INBOUND: "Inbound",
  CALL: "Cold call",
  OTHER: "Other",
};

export const ACTIVITY_LABEL: Record<ProspectActivityType, string> = {
  NOTE: "Note",
  CALL: "Call",
  WHATSAPP: "WhatsApp",
  VISIT: "Visit",
  STAGE_CHANGE: "Stage change",
  FOLLOW_UP: "Follow-up",
};
