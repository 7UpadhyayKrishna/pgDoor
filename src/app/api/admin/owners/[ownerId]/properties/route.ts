import { createListing, createPropertySchema } from "@/modules/properties";
import { linkProspectToOwner } from "@/modules/crm";
import { handleRouteError, jsonOk } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { HttpError } from "@/lib/rbac";
import { requireAdmin } from "@/lib/session";

export async function POST(
  request: Request,
  context: { params: Promise<{ ownerId: string }> },
) {
  try {
    const admin = await requireAdmin();
    const { ownerId } = await context.params;
    const owner = await prisma.ownerProfile.findUnique({ where: { id: ownerId }, select: { id: true } });
    if (!owner) throw new HttpError(404, "Owner not found");

    const body = createPropertySchema.parse(await request.json());
    const property = await createListing(owner.id, body);
    await prisma.auditLog.create({
      data: {
        actorId: admin.id,
        action: "ADMIN_LISTED",
        entityType: "property",
        entityId: property.id,
        metadata: { ownerProfileId: owner.id },
      },
    });

    const prospectId = new URL(request.url).searchParams.get("prospectId");
    if (prospectId) await linkProspectToOwner(prospectId, owner.id, admin.id, property.name);

    return jsonOk(
      { property: { id: property.id, slug: property.slug, status: property.status, name: property.name } },
      201,
    );
  } catch (error) {
    return handleRouteError(error);
  }
}
