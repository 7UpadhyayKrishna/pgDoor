import Link from "next/link";
import { getCurrentUser } from "@/lib/session";
import { Logo } from "@/components/logo";

const links = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/pgs", label: "Properties" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/leads", label: "Leads" },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  return (
    <div className="min-h-screen bg-canvas text-ink">
      <header className="border-b border-border bg-white">
        <div className="container-pg flex h-14 items-center justify-between">
          <Logo />
          <span className="text-xs text-muted-foreground">{user?.phone} · admin</span>
        </div>
      </header>
      <div className="container-pg flex flex-col gap-6 py-6 md:flex-row">
        <aside className="md:w-44">
          <nav className="flex gap-2 md:flex-col">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-xl px-3 py-2 text-sm text-ink hover:bg-white"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </aside>
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}
