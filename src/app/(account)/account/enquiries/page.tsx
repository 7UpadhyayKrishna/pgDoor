import Link from "next/link";
import { requireUser } from "@/lib/session";
import { listSeekerLeads } from "@/modules/leads";
import { MOVE_IN_LABEL } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function EnquiriesPage() {
  const user = await requireUser();
  const leads = await listSeekerLeads(user.id);
  return (
    <div>
      <h1 className="text-2xl font-bold">Enquiries</h1>
      <ul className="mt-6 space-y-3">
        {leads.map((lead) => (
          <li key={lead.id} className="rounded-[18px] bg-white p-4 shadow-card">
            <Link href={`/pg/${lead.property.slug}`} className="font-semibold">
              {lead.property.name}
            </Link>
            <p className="text-sm text-muted-foreground">
              {MOVE_IN_LABEL[lead.moveInWindow]} · {lead.status}
            </p>
          </li>
        ))}
        {leads.length === 0 ? (
          <p className="text-muted-foreground">No enquiries yet.</p>
        ) : null}
      </ul>
    </div>
  );
}
