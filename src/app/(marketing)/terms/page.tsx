import type { Metadata } from "next";
import { StaticPage, StaticSection } from "@/components/static-page";

export const metadata: Metadata = {
  title: "Terms of use",
  description: "The terms for using pgDoor as a tenant or a PG owner.",
};

export default function TermsPage() {
  return (
    <StaticPage title="Terms of use" updated="10 November 2026">
      <StaticSection title="What pgDoor is">
        <p>
          pgDoor is a discovery marketplace. Owners list their PGs; tenants search, compare and
          contact owners. pgDoor is not a party to any rental agreement, and we don&apos;t collect
          rent or deposits.
        </p>
      </StaticSection>
      <StaticSection title="For tenants">
        <ul className="list-disc space-y-1 pl-5">
          <li>Searching is free and doesn&apos;t need an account.</li>
          <li>
            Rent, deposits, food and availability come from owners. Always visit the PG and confirm
            charges in writing before you pay anything.
          </li>
          <li>Commute times and costs are estimates and can change with traffic and fares.</li>
          <li>Don&apos;t send spam or misleading enquiries.</li>
        </ul>
      </StaticSection>
      <StaticSection title="For owners">
        <ul className="list-disc space-y-1 pl-5">
          <li>Listings must describe a real PG you own or manage, with accurate prices and photos.</li>
          <li>Keep availability up to date. We may hide listings that look stale or misleading.</li>
          <li>Only upload photos you have the right to use.</li>
        </ul>
      </StaticSection>
      <StaticSection title="Reporting problems">
        <p>
          Use &ldquo;Report this PG&rdquo; on any listing, or write to{" "}
          <a href="mailto:hello@pgdoor.in" className="font-medium text-primary hover:underline">
            hello@pgdoor.in
          </a>
          . We may remove listings or accounts that break these terms.
        </p>
      </StaticSection>
    </StaticPage>
  );
}
