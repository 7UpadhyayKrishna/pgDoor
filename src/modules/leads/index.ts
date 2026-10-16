import { z } from "zod";
import { LeadIntentScore, LeadMoveInWindow, RoomSharingType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { HttpError } from "@/lib/rbac";
import { AnalyticsEvent, track } from "@/modules/analytics";

export const createLeadSchema = z.object({
  propertyId: z.string(),
  moveInWindow: z.enum(["IMMEDIATE", "WITHIN_7_DAYS", "THIS_MONTH", "LATER"]),
  roomPreference: z.enum(["SINGLE", "DOUBLE", "TRIPLE", "FOUR"]).optional(),
  budget: z.number().int().positive().optional(),
  message: z.string().trim().min(1).max(2000).optional(),
});

export function scoreLead(input: {
  moveInWindow: LeadMoveInWindow;
  budget?: number | null;
  roomPreference?: RoomSharingType | null;
  phoneVerified: boolean;
  minRent: number;
}): LeadIntentScore {
  let points = 0;
  if (input.phoneVerified) points += 2;
  if (input.moveInWindow === "IMMEDIATE") points += 3;
  else if (input.moveInWindow === "WITHIN_7_DAYS") points += 2;
  else if (input.moveInWindow === "THIS_MONTH") points += 1;
  if (
    input.budget &&
    input.minRent &&
    Math.abs(input.budget - input.minRent) / input.minRent <= 0.2
  ) {
    points += 2;
  }
  if (input.roomPreference) points += 1;
  if (points >= 5) return "HIGH";
  if (points >= 3) return "MEDIUM";
  return "LOW";
}

export async function createEnquiry(
  seekerId: string,
  phoneVerified: boolean,
  input: z.infer<typeof createLeadSchema>,
) {
  const property = await prisma.property.findUnique({
    where: { id: input.propertyId },
    include: { owner: true },
  });
  if (!property || property.status !== "PUBLISHED") {
    throw new HttpError(404, "This PG is not available");
  }

  const intentScore = scoreLead({
    moveInWindow: input.moveInWindow,
    budget: input.budget,
    roomPreference: input.roomPreference,
    phoneVerified,
    minRent: property.minRent,
  });

  const lead = await prisma.lead.create({
    data: {
      seekerId,
      propertyId: property.id,
      ownerId: property.ownerId,
      moveInWindow: input.moveInWindow,
      roomPreference: input.roomPreference,
      budget: input.budget,
      phoneVerified,
      intentScore,
    },
    include: {
      property: { select: { name: true, slug: true } },
      seeker: { select: { name: true, phone: true } },
    },
  });

  await prisma.leadEvent.create({
    data: {
      leadId: lead.id,
      propertyId: property.id,
      userId: seekerId,
      type: "ENQUIRY",
    },
  });

  if (input.message) {
    await prisma.chatMessage.create({
      data: {
        leadId: lead.id,
        senderId: seekerId,
        body: input.message,
      },
    });
  }

  await track(AnalyticsEvent.contact, {
    propertyId: property.id,
    leadId: lead.id,
    intentScore,
  });

  return lead;
}

async function assertLeadParticipant(leadId: string, userId: string, ownerProfileId?: string | null) {
  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    select: {
      id: true,
      seekerId: true,
      ownerId: true,
      property: { select: { name: true } },
    },
  });
  if (!lead) throw new HttpError(404, "Conversation not found");

  const isSeeker = lead.seekerId === userId;
  const isOwner = Boolean(ownerProfileId && lead.ownerId === ownerProfileId);
  if (!isSeeker && !isOwner) {
    throw new HttpError(403, "You cannot access this chat");
  }
  return lead;
}

export async function listLeadMessages(
  leadId: string,
  userId: string,
  ownerProfileId?: string | null,
) {
  await assertLeadParticipant(leadId, userId, ownerProfileId);
  return prisma.chatMessage.findMany({
    where: { leadId },
    orderBy: { createdAt: "asc" },
    include: {
      sender: { select: { id: true, name: true, role: true } },
    },
  });
}

export async function sendLeadMessage(
  leadId: string,
  userId: string,
  body: string,
  ownerProfileId?: string | null,
) {
  const text = body.trim();
  if (!text) throw new HttpError(400, "Message cannot be empty");
  if (text.length > 2000) throw new HttpError(400, "Message is too long");

  await assertLeadParticipant(leadId, userId, ownerProfileId);

  return prisma.chatMessage.create({
    data: {
      leadId,
      senderId: userId,
      body: text,
    },
    include: {
      sender: { select: { id: true, name: true, role: true } },
    },
  });
}

export async function listOwnerLeads(ownerProfileId: string) {
  return prisma.lead.findMany({
    where: { ownerId: ownerProfileId },
    include: {
      property: { select: { name: true, slug: true, minRent: true } },
      seeker: { select: { name: true, phone: true, phoneVerified: true } },
      visits: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function listSeekerLeads(seekerId: string) {
  return prisma.lead.findMany({
    where: { seekerId },
    include: {
      property: {
        select: { name: true, slug: true, minRent: true, photos: { take: 1 } },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function recordClick(input: {
  propertyId: string;
  userId?: string;
  type: "WHATSAPP_CLICK" | "CALL_CLICK" | "VISIT_REQUEST";
  leadId?: string;
}) {
  const property = await prisma.property.findUnique({
    where: { id: input.propertyId },
    select: { id: true, owner: { include: { user: true } } },
  });
  if (!property) throw new HttpError(404, "PG not found");

  await prisma.leadEvent.create({
    data: {
      propertyId: input.propertyId,
      userId: input.userId,
      leadId: input.leadId,
      type: input.type,
    },
  });

  // Owner contact is returned only after a structured enquiry exists.
  if (!input.leadId) {
    return { recorded: true };
  }

  return {
    recorded: true,
    whatsapp: property.owner.user.phone,
  };
}

export const createVisitSchema = z.object({
  propertyId: z.string(),
  scheduledAt: z.string(),
});

export async function requestVisit(
  seekerId: string,
  phoneVerified: boolean,
  input: z.infer<typeof createVisitSchema>,
) {
  const scheduledAt = new Date(input.scheduledAt);
  if (Number.isNaN(scheduledAt.getTime())) {
    throw new HttpError(400, "Pick a valid visit time");
  }
  if (scheduledAt.getTime() <= Date.now()) {
    throw new HttpError(400, "Visit must be in the future");
  }

  let lead = await prisma.lead.findFirst({
    where: { seekerId, propertyId: input.propertyId },
    orderBy: { createdAt: "desc" },
  });

  if (!lead) {
    lead = await createEnquiry(seekerId, phoneVerified, {
      propertyId: input.propertyId,
      moveInWindow: "WITHIN_7_DAYS",
    });
  }

  await prisma.lead.update({
    where: { id: lead.id },
    data: { status: "VISIT_SCHEDULED" },
  });

  const visit = await prisma.visit.create({
    data: {
      leadId: lead.id,
      scheduledAt,
      status: "REQUESTED",
    },
  });

  await prisma.leadEvent.create({
    data: {
      leadId: lead.id,
      propertyId: input.propertyId,
      userId: seekerId,
      type: "VISIT_REQUEST",
    },
  });

  await track(AnalyticsEvent.visit, { propertyId: input.propertyId, visitId: visit.id });
  return visit;
}

export async function leadCounts(ownerProfileId: string) {
  const [high, medium, low] = await Promise.all([
    prisma.lead.count({ where: { ownerId: ownerProfileId, intentScore: "HIGH", status: "NEW" } }),
    prisma.lead.count({ where: { ownerId: ownerProfileId, intentScore: "MEDIUM", status: "NEW" } }),
    prisma.lead.count({ where: { ownerId: ownerProfileId, intentScore: "LOW", status: "NEW" } }),
  ]);
  return { high, medium, low, total: high + medium + low };
}
