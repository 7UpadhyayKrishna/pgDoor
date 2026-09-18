import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function OwnersLandingPage() {
  return (
    <div className="container-pg py-12">
      <div className="rounded-[24px] bg-primary-soft px-6 py-12 md:px-12">
        <h1 className="max-w-xl text-4xl font-bold text-ink">Fill your vacant beds faster.</h1>
        <p className="mt-3 max-w-xl text-ink/70">
          List your PG on pgDoor and connect with people actively looking for accommodation.
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
      <ul className="mt-10 grid gap-3 text-sm text-ink sm:grid-cols-2">
        {[
          "More enquiries",
          "Better visibility",
          "Verified profile",
          "Availability management",
          "Lead dashboard",
        ].map((item) => (
          <li key={item} className="rounded-[16px] bg-white px-4 py-3 shadow-card">
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
