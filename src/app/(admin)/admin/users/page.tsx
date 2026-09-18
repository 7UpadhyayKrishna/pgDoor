import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  await requireAdmin();
  const users = await prisma.user.findMany({
    include: { ownerProfile: true },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div>
      <h1 className="text-2xl font-bold">Users</h1>
      <ul className="mt-6 space-y-2 text-sm">
        {users.map((user) => (
          <li key={user.id} className="rounded-[16px] bg-white px-4 py-3 shadow-card">
            {user.phone} · {user.role}
            {user.blocked ? " · blocked" : ""}
            {user.ownerProfile ? " · owner" : ""}
          </li>
        ))}
      </ul>
    </div>
  );
}
