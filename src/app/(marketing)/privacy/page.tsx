import type { Metadata } from "next";
import { StaticPage, StaticSection } from "@/components/static-page";

export const metadata: Metadata = {
  title: "Privacy policy",
  description: "What pgDoor collects, why, and how you can ask us to delete it.",
};

export default function PrivacyPage() {
  return (
    <StaticPage title="Privacy policy" updated="10 November 2026">
      <StaticSection title="What we collect">
        <ul className="list-disc space-y-1 pl-5">
          <li>Your mobile number, to sign you in with a one-time code and verify enquiries.</li>
          <li>Your name, if you choose to give it.</li>
          <li>
            Enquiries, visit requests, saved PGs, saved searches and chat messages you send to
            owners.
          </li>
          <li>
            Destinations you search from (for example your office), so we can show commute times.
            Your last destination is stored only in your browser and you can clear it at any time.
          </li>
          <li>For owners: listing details, photos, room inventory and contact details.</li>
          <li>Basic usage data such as pages viewed, to keep the service working and improve it.</li>
        </ul>
      </StaticSection>
      <StaticSection title="How we use it">
        <p>
          We use your data to run pgDoor: sign-in, sending your enquiry to the owner, showing the
          owner&apos;s contact details to you after a verified enquiry, alerts you ask for (such as
          &ldquo;notify me when a bed opens&rdquo;), and preventing spam and abuse. We don&apos;t
          sell your data.
        </p>
      </StaticSection>
      <StaticSection title="Who we share it with">
        <p>
          When you send an enquiry or book a visit, the owner of that PG sees your name, phone number
          and what you sent. Owner phone numbers stay hidden on public pages until you send an
          OTP-verified enquiry. We use service providers for SMS delivery, hosting, storage and maps;
          they process data only on our behalf.
        </p>
      </StaticSection>
      <StaticSection title="Your choices">
        <p>
          You can ask us to correct or delete your account and data by writing to{" "}
          <a href="mailto:hello@pgdoor.in" className="font-medium text-primary hover:underline">
            hello@pgdoor.in
          </a>{" "}
          from the number or email linked to your account. We keep records we&apos;re legally
          required to keep.
        </p>
      </StaticSection>
    </StaticPage>
  );
}
