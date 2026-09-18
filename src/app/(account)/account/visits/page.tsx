import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function VisitsPage() {
  const user = await requireUser();
  const visits = await prisma.visit.findMany({
    where: { lead: { seekerId: user.id } },
    include: { lead: { include: { property: { select: { name: true, slug: true } } } } },
    orderBy: { scheduledAt: "desc" },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold">My visits</h1>
      {visits.length === 0 ? (
        <p className="mt-3 text-muted-foreground">No visits yet. Book a visit from a PG page.</p>
      ) : (
        <ul className="mt-6 space-y-3">
          {visits.map((visit) => (
            <li key={visit.id} className="rounded-[18px] bg-white p-4 shadow-card">
              <Link href={`/pg/${visit.lead.property.slug}`} className="font-semibold">
                {visit.lead.property.name}
              </Link>
              <p className="text-sm text-muted-foreground">
                {visit.scheduledAt.toLocaleString("en-IN")} · {visit.status}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
