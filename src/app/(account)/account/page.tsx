import Link from "next/link";
import { getCurrentUser } from "@/lib/session";
import { LogoutButton } from "@/components/auth/logout-button";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const user = await getCurrentUser();
  return (
    <div className="max-w-lg pb-8">
      <h1 className="text-2xl font-bold">My pgDoor</h1>
      <p className="mt-2 text-muted-foreground">{user?.name ?? user?.phone}</p>
      <ul className="mt-6 divide-y divide-border overflow-hidden rounded-[18px] bg-white shadow-card">
        {[
          ["/saved", "Saved PGs"],
          ["/alerts", "Saved searches & alerts"],
          ["/account/enquiries", "My enquiries"],
          ["/account/visits", "My visits"],
          ["/pgs", "Recently viewed"],
          ["/help", "Help"],
        ].map(([href, label]) => (
          <li key={href}>
            <Link href={href} className="block px-4 py-3.5 font-medium hover:bg-canvas">
              {label}
            </Link>
          </li>
        ))}
      </ul>
      <div className="mt-8">
        <LogoutButton />
      </div>
    </div>
  );
}
