import { z } from "zod";
import { normalizePhone } from "@/lib/otp";
import { generateTempPassword, hashPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import { HttpError } from "@/lib/rbac";

export const adminOwnerSchema = z.object({
  name: z.string().trim().min(2, "Enter the owner's name").max(120),
  phone: z.string().min(10, "Enter a valid 10-digit mobile number"),
  businessName: z.string().trim().max(120).optional(),
});

export type IssuedOwner = {
  ownerProfileId: string;
  userId: string;
  name: string | null;
  phone: string;
  /** Plain text only on the response that created it; never stored. */
  tempPassword: string | null;
  existing: boolean;
};

async function issueTempPassword(userId: string) {
  const tempPassword = generateTempPassword();
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: await hashPassword(tempPassword), mustChangePassword: true },
  });
  return tempPassword;
}

export async function createOwnerWithCredentials(
  input: z.infer<typeof adminOwnerSchema>,
  adminId: string,
): Promise<IssuedOwner> {
  const phone = normalizePhone(input.phone);
  const businessName = input.businessName || undefined;
  let user = await prisma.user.findUnique({ where: { phone }, include: { ownerProfile: true } });
  const existing = Boolean(user);

  if (user?.role === "ADMIN") {
    throw new HttpError(409, "This number belongs to an admin account");
  }

  if (!user) {
    user = await prisma.user.create({
      data: { phone, name: input.name, role: "OWNER" },
      include: { ownerProfile: true },
    });
  } else if (user.role === "SEEKER" || !user.name) {
    user = await prisma.user.update({
      where: { id: user.id },
      data: { role: "OWNER", name: user.name ?? input.name },
      include: { ownerProfile: true },
    });
  }

  const profile =
    user.ownerProfile ??
    (await prisma.ownerProfile.create({
      data: { userId: user.id, businessName, createdByAdminId: adminId },
    }));

  let tempPassword: string | null = null;
  if (!user.passwordHash) {
    tempPassword = await issueTempPassword(user.id);
    await prisma.ownerProfile.update({
      where: { id: profile.id },
      data: { credentialIssuedAt: new Date() },
    });
  }

  await prisma.auditLog.create({
    data: {
      actorId: adminId,
      action: existing ? "OWNER_LINKED" : "OWNER_CREATED",
      entityType: "owner",
      entityId: profile.id,
      metadata: { phone, credentialIssued: Boolean(tempPassword) },
    },
  });

  return {
    ownerProfileId: profile.id,
    userId: user.id,
    name: user.name,
    phone,
    tempPassword,
    existing,
  };
}

export async function resetOwnerPassword(ownerProfileId: string, adminId: string) {
  const profile = await prisma.ownerProfile.findUnique({
    where: { id: ownerProfileId },
    include: { user: true },
  });
  if (!profile) throw new HttpError(404, "Owner not found");
  if (profile.user.role === "ADMIN") throw new HttpError(409, "Admin passwords can't be reset here");

  const tempPassword = await issueTempPassword(profile.userId);
  await prisma.$transaction([
    prisma.session.deleteMany({ where: { userId: profile.userId } }),
    prisma.ownerProfile.update({
      where: { id: profile.id },
      data: { credentialIssuedAt: new Date() },
    }),
    prisma.auditLog.create({
      data: {
        actorId: adminId,
        action: "PASSWORD_RESET",
        entityType: "owner",
        entityId: profile.id,
      },
    }),
  ]);

  return { phone: profile.user.phone, name: profile.user.name, tempPassword };
}

export async function listOwnersForAdmin(q?: string) {
  const query = q?.trim();
  return prisma.ownerProfile.findMany({
    where: query
      ? {
          OR: [
            { businessName: { contains: query, mode: "insensitive" } },
            { user: { name: { contains: query, mode: "insensitive" } } },
            { user: { phone: { contains: query.replace(/\D/g, "") || query } } },
          ],
        }
      : undefined,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          phone: true,
          passwordHash: true,
          mustChangePassword: true,
          lastLoginAt: true,
          blocked: true,
        },
      },
      _count: { select: { properties: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
}
