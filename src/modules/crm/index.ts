import { z } from "zod";
import type { Prisma, ProspectActivityType, ProspectSource, ProspectStage } from "@prisma/client";
import { OPEN_STAGES, PROSPECT_STAGES, STAGE_LABEL } from "@/lib/crm-labels";
import { endOfIstDay, formatIst } from "@/lib/ist";
import { normalizePhone } from "@/lib/otp";
import { prisma } from "@/lib/prisma";
import { HttpError } from "@/lib/rbac";

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => v || undefined);

export const prospectSchema = z.object({
  name: z.string().trim().min(2, "Enter the owner's name").max(120),
  phone: z.string().min(10, "Enter a valid 10-digit mobile number"),
  businessName: optionalText(120),
  pgName: optionalText(120),
  cityId: optionalText(40),
  areaId: optionalText(40),
  address: optionalText(500),
  approxBeds: z.coerce.number().int().min(0).max(5000).optional(),
  source: z.enum(["FIELD_VISIT", "REFERRAL", "INBOUND", "CALL", "OTHER"]).default("OTHER"),
  assignedToId: optionalText(40),
});

export type ProspectInput = z.infer<typeof prospectSchema>;

function prospectData(input: ProspectInput) {
  return {
    name: input.name,
    phone: normalizePhone(input.phone),
    businessName: input.businessName ?? null,
    pgName: input.pgName ?? null,
    cityId: input.cityId ?? null,
    areaId: input.areaId ?? null,
    address: input.address ?? null,
    approxBeds: input.approxBeds ?? null,
    source: input.source as ProspectSource,
    assignedToId: input.assignedToId ?? null,
  };
}

export async function createProspect(input: ProspectInput, actorId: string) {
  const prospect = await prisma.ownerProspect.create({
    data: {
      ...prospectData(input),
      activities: { create: { actorId, type: "NOTE", body: "Prospect added" } },
    },
  });
  return prospect;
}

export const inboundContactSchema = z.object({
  name: z.string().trim().min(2, "Enter your name").max(120),
  phone: z
    .string()
    .trim()
    .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit mobile number"),
  pgName: optionalText(120),
  message: z.string().trim().min(5, "Tell us a little more").max(2000),
});

/** "Contact us" from a PG owner lands in the admin CRM as a new inbound prospect. */
export async function createInboundProspect(input: z.infer<typeof inboundContactSchema>) {
  return prisma.ownerProspect.create({
    data: {
      name: input.name,
      phone: normalizePhone(input.phone),
      pgName: input.pgName ?? null,
      source: "INBOUND",
      activities: { create: { type: "NOTE", body: `Contact form: ${input.message}` } },
    },
    select: { id: true },
  });
}

export async function updateProspect(id: string, input: ProspectInput) {
  return prisma.ownerProspect.update({ where: { id }, data: prospectData(input) });
}

export async function changeStage(
  id: string,
  stage: ProspectStage,
  actorId: string | null,
  opts?: { lostReason?: string; body?: string },
) {
  const current = await prisma.ownerProspect.findUnique({ where: { id }, select: { stage: true } });
  if (!current) throw new HttpError(404, "Prospect not found");
  if (current.stage === stage) return;

  await prisma.$transaction([
    prisma.ownerProspect.update({
      where: { id },
      data: {
        stage,
        lostReason: stage === "LOST" ? (opts?.lostReason ?? null) : null,
        // Closed prospects don't need chasing.
        ...(OPEN_STAGES.includes(stage) ? {} : { nextFollowUpAt: null }),
      },
    }),
    prisma.prospectActivity.create({
      data: {
        prospectId: id,
        actorId,
        type: "STAGE_CHANGE",
        body:
          opts?.body ??
          `${STAGE_LABEL[current.stage]} → ${STAGE_LABEL[stage]}${
            stage === "LOST" && opts?.lostReason ? `: ${opts.lostReason}` : ""
          }`,
        metadata: { from: current.stage, to: stage },
      },
    }),
  ]);
}

export async function addActivity(
  id: string,
  type: Exclude<ProspectActivityType, "STAGE_CHANGE" | "FOLLOW_UP">,
  body: string,
  actorId: string,
) {
  const text = body.trim();
  if (!text) throw new HttpError(400, "Write something to log");
  await prisma.$transaction([
    prisma.prospectActivity.create({ data: { prospectId: id, actorId, type, body: text } }),
    // Touch updatedAt so the pipeline sorts by recent activity.
    prisma.ownerProspect.update({ where: { id }, data: { updatedAt: new Date() } }),
  ]);
}

export async function setFollowUp(id: string, at: Date | null, actorId: string, note?: string) {
  await prisma.$transaction([
    prisma.ownerProspect.update({ where: { id }, data: { nextFollowUpAt: at } }),
    prisma.prospectActivity.create({
      data: {
        prospectId: id,
        actorId,
        type: "FOLLOW_UP",
        body: at
          ? `Follow-up set for ${formatIst(at)}${note ? ` — ${note}` : ""}`
          : "Follow-up cleared",
        metadata: { at: at?.toISOString() ?? null },
      },
    }),
  ]);
}

export async function assignProspect(id: string, assignedToId: string | null) {
  await prisma.ownerProspect.update({ where: { id }, data: { assignedToId } });
}

export type ProspectFilters = {
  stage?: ProspectStage;
  assignedToId?: string;
  source?: ProspectSource;
  q?: string;
};

function filterWhere(filters: ProspectFilters): Prisma.OwnerProspectWhereInput {
  const q = filters.q?.trim();
  const digits = q?.replace(/\D/g, "");
  return {
    ...(filters.stage ? { stage: filters.stage } : {}),
    ...(filters.assignedToId ? { assignedToId: filters.assignedToId } : {}),
    ...(filters.source ? { source: filters.source } : {}),
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { pgName: { contains: q, mode: "insensitive" } },
            { businessName: { contains: q, mode: "insensitive" } },
            ...(digits ? [{ phone: { contains: digits } }] : []),
          ],
        }
      : {}),
  };
}

export async function listProspects(filters: ProspectFilters = {}) {
  return prisma.ownerProspect.findMany({
    where: filterWhere(filters),
    include: {
      area: { select: { name: true } },
      city: { select: { name: true } },
      assignedTo: { select: { id: true, name: true, phone: true } },
    },
    orderBy: { updatedAt: "desc" },
    take: 500,
  });
}

export async function followUpsDue(filters: ProspectFilters = {}, now = new Date()) {
  return prisma.ownerProspect.findMany({
    where: {
      ...filterWhere(filters),
      stage: { in: OPEN_STAGES },
      nextFollowUpAt: { lte: endOfIstDay(now) },
    },
    include: { assignedTo: { select: { name: true, phone: true } } },
    orderBy: { nextFollowUpAt: "asc" },
    take: 50,
  });
}

export async function stageCounts() {
  const rows = await prisma.ownerProspect.groupBy({ by: ["stage"], _count: { _all: true } });
  const counts = Object.fromEntries(PROSPECT_STAGES.map((s) => [s, 0])) as Record<ProspectStage, number>;
  for (const row of rows) counts[row.stage] = row._count._all;
  return counts;
}

export async function getProspect(id: string) {
  const prospect = await prisma.ownerProspect.findUnique({
    where: { id },
    include: {
      city: true,
      area: true,
      assignedTo: { select: { id: true, name: true, phone: true } },
      ownerProfile: {
        include: {
          user: { select: { name: true, phone: true, lastLoginAt: true } },
          properties: { select: { id: true, name: true, status: true } },
        },
      },
      activities: {
        include: { actor: { select: { name: true, phone: true } } },
        orderBy: { createdAt: "desc" },
      },
    },
  });
  if (!prospect) throw new HttpError(404, "Prospect not found");
  return prospect;
}

/** An owner account already using this phone, so the team doesn't onboard the same person twice. */
export async function existingOwnerForPhone(phone: string) {
  return prisma.user.findFirst({
    where: { phone, ownerProfile: { isNot: null } },
    select: { name: true, phone: true, ownerProfile: { select: { id: true } } },
  });
}

export async function listAdmins() {
  return prisma.user.findMany({
    where: { role: "ADMIN" },
    select: { id: true, name: true, phone: true },
    orderBy: { name: "asc" },
  });
}

export async function linkProspectToOwner(
  prospectId: string,
  ownerProfileId: string,
  actorId: string,
  pgName: string,
) {
  const prospect = await prisma.ownerProspect.findUnique({ where: { id: prospectId } });
  if (!prospect) return;
  await prisma.ownerProspect.update({ where: { id: prospectId }, data: { ownerProfileId } });
  await changeStage(prospectId, prospect.stage === "ONBOARDED" ? "ONBOARDED" : "LISTED", actorId, {
    body: `Listed "${pgName}" on pgDoor`,
  });
}

/** First owner login moves any LISTED prospect for that owner to ONBOARDED. */
export async function markOwnerOnboarded(userId: string) {
  const owner = await prisma.ownerProfile.findUnique({ where: { userId }, select: { id: true } });
  if (!owner) return;
  const prospects = await prisma.ownerProspect.findMany({
    where: { ownerProfileId: owner.id, stage: "LISTED" },
    select: { id: true },
  });
  for (const prospect of prospects) {
    await changeStage(prospect.id, "ONBOARDED", null, { body: "Owner logged in for the first time" });
  }
}
