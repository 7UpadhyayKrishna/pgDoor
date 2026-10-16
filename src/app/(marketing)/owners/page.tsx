import Link from "next/link";
import { Button } from "@/components/ui/button";

const sections = [
  {
    id: "features",
    title: "Key features",
    body: "pgDoor helps people find verified PGs across NCR with real photos, transparent pricing, and up-to-date bed availability. Owners get a simple way to list, manage inventory, and respond to genuine enquiries.",
  },
  {
    id: "search",
    title: "Search and explore PGs",
    body: "Start from the homepage or Search, pick a city like Gurgaon, Noida, or Delhi, then filter by budget, sharing type, amenities, and move-in date. Open any listing to see photos, rent, deposits, food, and location on the map.",
  },
  {
    id: "compare",
    title: "Compare options",
    body: "Shortlist listings that fit your needs and use Compare to review rent, sharing, amenities, and location side by side before you decide which PGs to visit.",
  },
  {
    id: "visits",
    title: "Book visits",
    body: "On a PG details page, tap Book visit, choose a future date and time slot, and send the request. The owner gets notified and can confirm your slot.",
  },
  {
    id: "contact",
    title: "Contact owners",
    body: "Send an enquiry from a listing to share your move-in window and questions. Track enquiries and visit requests from your account so follow-ups stay in one place.",
  },
  {
    id: "list",
    title: "List and manage your PG",
    body: "Owners can list a property with location, rooms, pricing, and amenities, then manage availability, leads, and visits from the owner dashboard. Keep beds and photos current so seekers see accurate information.",
  },
];

export default function OwnersLandingPage() {
  return (
    <div className="container-pg py-12">
      <div className="rounded-[24px] bg-primary-soft px-6 py-12 md:px-12">
        <h1 className="max-w-xl text-4xl font-bold text-ink">How pgDoor works</h1>
        <p className="mt-3 max-w-xl text-ink/70">
          From searching PGs to booking visits and listing your property — here is everything you
          can do on pgDoor.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button asChild size="lg">
            <Link href="/owners/register">List Your PG</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/login?next=/owners/dashboard">Owner Login</Link>
          </Button>
        </div>
      </div>

      <div className="mt-10 space-y-8">
        {sections.map((section) => (
          <section key={section.id} id={section.id} className="max-w-3xl">
            <h2 className="text-xl font-semibold text-ink">{section.title}</h2>
            <p className="mt-2 text-sm leading-6 text-ink/70 sm:text-base">{section.body}</p>
          </section>
        ))}
      </div>

      <div id="pricing" className="mt-12 max-w-3xl rounded-[18px] bg-white px-5 py-6 shadow-card">
        <h2 className="text-xl font-semibold text-ink">For owners</h2>
        <p className="mt-2 text-sm leading-6 text-ink/70 sm:text-base">
          Listing on pgDoor is designed to fill vacant beds with people actively looking. Publish
          your PG, keep availability updated, and respond to enquiries and visit requests from one
          dashboard.
        </p>
        <div className="mt-4">
          <Button asChild>
            <Link href="/owners/register">Get started</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
