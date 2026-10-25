import { z } from "zod";
import { ALLOWED_IMAGE_MIME, createPhotoUpload, type UploadScope } from "@/lib/storage";
import { prisma } from "@/lib/prisma";
import { HttpError } from "@/lib/rbac";

export const presignSchema = z.object({
  fileName: z.string().min(1).max(200),
  mimeType: z.enum(ALLOWED_IMAGE_MIME),
  size: z.number().int().positive(),
});

export async function presignPhoto(input: z.infer<typeof presignSchema>, scope: UploadScope) {
  return createPhotoUpload({ ...input, scope });
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
