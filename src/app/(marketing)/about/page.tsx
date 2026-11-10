import type { Metadata } from "next";
import Link from "next/link";
import { StaticPage, StaticSection } from "@/components/static-page";

export const metadata: Metadata = {
  title: "About us",
  description: "pgDoor helps tenants in Gurgaon and NCR find a PG by daily commute, rent and true monthly cost.",
};

export default function AboutPage() {
  return (
    <StaticPage
      title="About pgDoor"
      intro="pgDoor helps students and working professionals find a PG that fits their day, not just their budget."
    >
      <StaticSection title="Commute first">
        <p>
          Most PG searches start with an area. Ours starts with the question that matters every
          morning: where do you go every day? Tell us your office, college or coaching centre and we
          show travel time by metro, bus, auto or your own vehicle, plus the true monthly cost of
          rent and commute together.
        </p>
      </StaticSection>
      <StaticSection title="What you see on a listing">
        <p>
          Every listing shows rent per bed for each room type, the security deposit when the owner
          has shared it (otherwise we say &ldquo;Ask owner&rdquo;), food, house rules, amenities and
          when availability was last updated. A listing is marked verified only after our team has
          checked the property itself.
        </p>
      </StaticSection>
      <StaticSection title="Where we are">
        <p>
          We&apos;re live in Gurgaon and onboarding PGs across Delhi, Noida and Greater Noida.{" "}
          <Link href="/pgs" className="font-medium text-primary hover:underline">
            Browse PGs
          </Link>{" "}
          or{" "}
          <Link href="/owners/register" className="font-medium text-primary hover:underline">
            list your PG for free
          </Link>
          .
        </p>
      </StaticSection>
      <StaticSection title="Contact">
        <p>
          Questions or feedback? Write to{" "}
          <a href="mailto:hello@pgdoor.in" className="font-medium text-primary hover:underline">
            hello@pgdoor.in
          </a>{" "}
          or use the <Link href="/contact" className="font-medium text-primary hover:underline">contact page</Link>.
        </p>
      </StaticSection>
    </StaticPage>
  );
}
