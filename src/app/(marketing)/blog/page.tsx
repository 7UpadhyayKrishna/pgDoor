import type { Metadata } from "next";
import Link from "next/link";
import { StaticPage, StaticSection } from "@/components/static-page";

export const metadata: Metadata = {
  title: "Guides",
  description: "Guides for finding a PG in Gurgaon and NCR.",
  robots: { index: false, follow: true },
};

export default function BlogPage() {
  return (
    <StaticPage
      title="Guides"
      intro="We're writing guides on choosing a PG, commuting in Gurgaon and avoiding rental scams. They'll appear here soon."
    >
      <StaticSection title="Meanwhile">
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <Link href="/pgs/gurgaon" className="font-medium text-primary hover:underline">
              Browse PGs in Gurgaon
            </Link>
          </li>
          <li>
            <Link href="/help" className="font-medium text-primary hover:underline">
              Read the help center
            </Link>
          </li>
        </ul>
      </StaticSection>
    </StaticPage>
  );
}
