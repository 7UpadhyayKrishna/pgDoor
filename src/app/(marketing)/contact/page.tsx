import type { Metadata } from "next";
import Link from "next/link";
import { ContactForm } from "@/components/contact-form";
import { StaticPage, StaticSection } from "@/components/static-page";

export const metadata: Metadata = {
  title: "Contact",
  description: "Contact the pgDoor team, or list your PG and we'll call you back.",
};

export default function ContactPage() {
  return (
    <StaticPage title="Contact us" intro="We usually reply within one working day.">
      <StaticSection title="Looking for a PG?">
        <p>
          The quickest way to reach an owner is &ldquo;Talk to the owner&rdquo; on the listing. For
          anything else, email{" "}
          <a href="mailto:hello@pgdoor.in" className="font-medium text-primary hover:underline">
            hello@pgdoor.in
          </a>{" "}
          or see the{" "}
          <Link href="/help" className="font-medium text-primary hover:underline">
            help center
          </Link>
          .
        </p>
      </StaticSection>
      <StaticSection title="Own or manage a PG?">
        <p>Leave your details and our team will call you to help list your PG for free.</p>
        <div className="mt-3 rounded-[20px] bg-white p-5 shadow-card">
          <ContactForm />
        </div>
      </StaticSection>
    </StaticPage>
  );
}
