import type { Metadata } from "next";
import Link from "next/link";
import { StaticPage, StaticSection } from "@/components/static-page";

export const metadata: Metadata = {
  title: "Help center",
  description: "How to search, enquire, book visits and list a PG on pgDoor.",
};

const FAQ: { q: string; a: React.ReactNode }[] = [
  {
    q: "Do I need an account to search?",
    a: "No. You can search, filter and compare PGs without signing in. You'll be asked for your mobile number only when you save a PG, send an enquiry or book a visit.",
  },
  {
    q: "How do I search by commute?",
    a: "On the homepage, type where you go every day (office, college or metro station), pick a max commute and how you travel. Results show travel time and the true monthly cost: rent plus commute.",
  },
  {
    q: "What does “Ask owner” mean for a deposit?",
    a: "The owner hasn't told us the security deposit yet. Ask them in your enquiry and confirm it in writing before paying.",
  },
  {
    q: "A PG I like is full. What can I do?",
    a: "Tap “Notify me when a bed opens” on the listing. We'll alert you as soon as the owner marks a bed free. The page also shows similar PGs nearby that have beds available.",
  },
  {
    q: "How do I contact an owner on WhatsApp or by phone?",
    a: "Send an enquiry from the listing and verify your number with a one-time code. You'll then see the owner's WhatsApp and phone buttons.",
  },
  {
    q: "How do I list my PG?",
    a: (
      <>
        Go to{" "}
        <Link href="/owners/register" className="font-medium text-primary hover:underline">
          List your PG
        </Link>
        . It&apos;s free and most owners finish in about 5 minutes. You can update rooms and
        availability from the owner dashboard.
      </>
    ),
  },
  {
    q: "Something on a listing is wrong.",
    a: "Use “Report this PG” at the bottom of the listing. Our team reviews every report.",
  },
];

export default function HelpPage() {
  return (
    <StaticPage title="Help center" intro="Answers to the questions we get most.">
      {FAQ.map((item) => (
        <StaticSection key={item.q} title={item.q}>
          <p>{item.a}</p>
        </StaticSection>
      ))}
      <StaticSection title="Still stuck?">
        <p>
          <Link href="/contact" className="font-medium text-primary hover:underline">
            Contact us
          </Link>{" "}
          or read our{" "}
          <Link href="/refund-policy" className="font-medium text-primary hover:underline">
            refund policy
          </Link>
          .
        </p>
      </StaticSection>
    </StaticPage>
  );
}
