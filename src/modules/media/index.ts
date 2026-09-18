import { z } from "zod";
import { createPresignedUpload, validateImageUpload } from "@/lib/s3";
import { prisma } from "@/lib/prisma";
import { HttpError } from "@/lib/rbac";

export const presignSchema = z.object({
  fileName: z.string().min(1),
  mimeType: z.enum(["image/jpeg", "image/png", "image/webp"]),
  size: z.number().int().positive(),
  propertyId: z.string().optional(),
});

export async function presignPhoto(input: z.infer<typeof presignSchema>) {
  validateImageUpload(input);
  return createPresignedUpload(input);
}

export async function attachPhoto(input: {
  propertyId: string;
  ownerProfileId: string;
  url: string;
  alt?: string;
}) {
  const property = await prisma.property.findUnique({
    where: { id: input.propertyId },
  });
  if (!property || property.ownerId !== input.ownerProfileId) {
    throw new HttpError(403, "You cannot add photos to this listing");
  }
  const count = await prisma.photo.count({ where: { propertyId: input.propertyId } });
  return prisma.photo.create({
    data: {
      propertyId: input.propertyId,
      url: input.url,
      alt: input.alt ?? property.name,
      sortOrder: count,
    },
  });
}
