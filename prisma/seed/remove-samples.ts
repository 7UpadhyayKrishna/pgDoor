import { PrismaClient } from "@prisma/client";
import { SAMPLE_OWNER_PHONES } from "./samples";

/** Deletes every sample owner account and everything they own. Run before launch. */
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    where: { phone: { in: SAMPLE_OWNER_PHONES } },
    select: { id: true, ownerProfile: { select: { id: true } } },
  });
  const userIds = users.map((u) => u.id);
  const ownerIds = users.flatMap((u) => (u.ownerProfile ? [u.ownerProfile.id] : []));

  const leads = await prisma.lead.deleteMany({ where: { ownerId: { in: ownerIds } } });
  const properties = await prisma.property.deleteMany({ where: { ownerId: { in: ownerIds } } });
  await prisma.auditLog.updateMany({ where: { actorId: { in: userIds } }, data: { actorId: null } });
  const deletedUsers = await prisma.user.deleteMany({ where: { id: { in: userIds } } });

  console.info(
    `Removed ${properties.count} sample PGs, ${leads.count} leads on them, and ${deletedUsers.count} sample owner accounts`,
  );
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
