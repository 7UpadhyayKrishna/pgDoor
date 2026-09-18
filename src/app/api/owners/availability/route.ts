import { z } from "zod";
import { confirmAvailability, setBedStatus } from "@/modules/inventory";
import { prisma } from "@/lib/prisma";
import { handleRouteError, jsonOk } from "@/lib/http";
import { requireOwner } from "@/lib/session";
import { HttpError } from "@/lib/rbac";
import { BedStatus } from "@prisma/client";

const schema = z.object({
  propertyId: z.string().optional(),
  bedId: z.string().optional(),
  status: z.enum(["AVAILABLE", "OCCUPIED", "RESERVED"]).optional(),
  confirm: z.boolean().optional(),
});

export async function POST(request: Request) {
  try {
    const user = await requireOwner();
    const body = schema.parse(await request.json());

    if (body.bedId && body.status) {
      const bed = await prisma.bed.findUnique({
        where: { id: body.bedId },
        include: { room: { include: { property: true } } },
      });
      if (!bed || (user.role !== "ADMIN" && bed.room.property.ownerId !== user.ownerProfileId)) {
        throw new HttpError(403, "Not your listing");
      }
      await setBedStatus(body.bedId, body.status as BedStatus);
    }

    if (body.propertyId && body.confirm) {
      const property = await prisma.property.findUnique({ where: { id: body.propertyId } });
      if (!property || (user.role !== "ADMIN" && property.ownerId !== user.ownerProfileId)) {
        throw new HttpError(403, "Not your listing");
      }
      await confirmAvailability(body.propertyId);
    }

    return jsonOk({ ok: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
