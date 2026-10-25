import { requireOwnerPage } from "@/lib/session";
import { listOwnerLeads } from "@/modules/leads";
import { MOVE_IN_LABEL } from "@/lib/constants";
import { formatInr } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { ChatSheet } from "@/components/listing/chat-sheet";

export const dynamic = "force-dynamic";

export default async function OwnerLeadsPage() {
  const user = await requireOwnerPage("/owners/leads");
  if (!user.ownerProfileId) {
    return <p>Complete owner registration first.</p>;
  }
  const leads = await listOwnerLeads(user.ownerProfileId);

  return (
    <div>
      <h1 className="text-2xl font-bold">Leads</h1>
      <ul className="mt-6 space-y-3">
        {leads.map((lead) => {
          const tel = lead.seeker.phone.replace(/\D/g, "");
          const wa = tel.startsWith("91") ? tel : `91${tel.slice(-10)}`;
          return (
            <li key={lead.id} className="rounded-[18px] bg-white p-4 shadow-card">
              <p className="text-xs font-semibold text-primary">
                {lead.intentScore === "HIGH"
                  ? "High intent"
                  : lead.intentScore === "MEDIUM"
                    ? "Medium"
                    : "Low"}
              </p>
              <p className="mt-1 font-semibold">{lead.seeker.name ?? lead.seeker.phone}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {lead.property.name} · Move-in: {MOVE_IN_LABEL[lead.moveInWindow]}
                {lead.budget ? ` · Budget: ${formatInr(lead.budget)}` : ""}
                {lead.roomPreference ? ` · Room: ${lead.roomPreference}` : ""}
                {lead.phoneVerified ? " · Phone verified ✓" : ""}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <ChatSheet
                  leadId={lead.id}
                  title={`Chat · ${lead.seeker.name ?? lead.seeker.phone}`}
                  triggerLabel="Chat"
                  triggerVariant="default"
                />
                <Button asChild variant="outline" size="sm">
                  <a href={`tel:${lead.seeker.phone}`}>Call</a>
                </Button>
                <Button asChild variant="outline" size="sm">
                  <a href={`https://wa.me/${wa}`} target="_blank" rel="noreferrer">
                    WhatsApp
                  </a>
                </Button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
