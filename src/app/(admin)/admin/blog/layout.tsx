import Link from "next/link";

const tabs = [
  { href: "/admin/blog", label: "Posts" },
  { href: "/admin/blog/categories", label: "Categories" },
  { href: "/admin/blog/tags", label: "Tags" },
  { href: "/admin/blog/authors", label: "Authors" },
];

export default function AdminBlogLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <nav className="mb-5 flex gap-1 overflow-x-auto border-b border-border">
        {tabs.map((tab) => (
          <Link key={tab.href} href={tab.href} className="shrink-0 rounded-t-lg px-4 py-2 text-sm font-semibold text-muted-foreground hover:bg-white hover:text-ink">
            {tab.label}
          </Link>
        ))}
      </nav>
      {children}
    </div>
  );
}
