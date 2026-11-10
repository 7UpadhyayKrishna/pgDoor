import type { Metadata } from "next";
import { StaticPage, StaticSection } from "@/components/static-page";

export const metadata: Metadata = {
  title: "Refund policy",
  description: "pgDoor doesn't collect rent or deposits. Here's who to talk to about refunds.",
};

export default function RefundPolicyPage() {
  return (
    <StaticPage title="Refund policy" updated="10 November 2026">
      <StaticSection title="pgDoor is free">
        <p>
          Searching, enquiring and booking visits are free for tenants, and listing a PG is free for
          owners. Because we don&apos;t charge you, there is nothing to refund from pgDoor.
        </p>
      </StaticSection>
      <StaticSection title="Rent and security deposits">
        <p>
          Rent, security deposits and any other charges are paid directly to the PG owner, never
          to pgDoor. Refunds of deposits or advance rent are governed by your agreement with the
          owner, including any notice period or lock-in shown on the listing.
        </p>
      </StaticSection>
      <StaticSection title="If something goes wrong">
        <p>
          If an owner refuses a refund they agreed to, or a listing was misleading, report the
          listing and write to{" "}
          <a href="mailto:hello@pgdoor.in" className="font-medium text-primary hover:underline">
            hello@pgdoor.in
          </a>
          . We&apos;ll review it and may remove the listing, but we can&apos;t recover money paid to
          an owner.
        </p>
      </StaticSection>
    </StaticPage>
  );
}
