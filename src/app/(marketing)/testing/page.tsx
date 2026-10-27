import Link from "next/link";
import type { Metadata } from "next";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ExitTestingButton } from "@/components/testing/exit-testing-button";
import { TesterLoginForm } from "@/components/testing/tester-login-form";
import { isPrelaunch } from "@/lib/launch";
import { hasTesterAccess } from "@/lib/launch-server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Testing",
  robots: { index: false, follow: false },
};

type FeatureLink = { href: string; label: string; note?: string };

async function samplePgSlug() {
  try {
    const pg = await prisma.property.findFirst({
      where: { status: "PUBLISHED" },
      orderBy: { createdAt: "desc" },
      select: { slug: true },
    });
    return pg?.slug ?? null;
  } catch {
    return null;
  }
}

async function featureGroups(): Promise<{ title: string; links: FeatureLink[] }[]> {
  const slug = await samplePgSlug();
  return [
    {
      title: "Discover",
      links: [
        { href: "/", label: "Marketplace home" },
        { href: "/pgs", label: "Search all PGs" },
        { href: "/pgs/gurgaon", label: "Explore Gurgaon" },
        { href: "/pgs/noida", label: "Explore Noida" },
        { href: "/pgs/delhi", label: "Explore Delhi" },
        slug
          ? { href: `/pg/${slug}`, label: "Sample listing page" }
          : { href: "/pgs", label: "Sample listing page", note: "No published PG yet" },
      ],
    },
    {
      title: "Shortlist",
      links: [
        { href: "/compare", label: "Compare PGs" },
        { href: "/saved", label: "Saved PGs", note: "Needs login" },
      ],
    },
    {
      title: "Account",
      links: [
        { href: "/login", label: "Login with OTP" },
        { href: "/register", label: "Register" },
        { href: "/account", label: "Profile", note: "Needs login" },
        { href: "/account/enquiries", label: "My enquiries", note: "Needs login" },
        { href: "/account/visits", label: "My visits", note: "Needs login" },
      ],
    },
    {
      title: "Owners",
      links: [
        { href: "/owners", label: "Owners landing" },
        { href: "/owners/register", label: "Owner registration" },
        { href: "/owners/dashboard", label: "Owner dashboard", note: "Needs owner login" },
      ],
    },
    {
      title: "Content",
      links: [
        { href: "/about", label: "About" },
        { href: "/blog", label: "Blog" },
        { href: "/help", label: "Help" },
        { href: "/contact", label: "Contact" },
        { href: "/privacy", label: "Privacy" },
        { href: "/terms", label: "Terms" },
      ],
    },
  ];
}

export default async function TestingPage() {
  if (!(await hasTesterAccess())) {
    return (
      <div className="container-pg flex min-h-[70vh] items-center justify-center py-16">
        <div className="w-full max-w-md rounded-[24px] bg-white p-6 shadow-card">
          <h1 className="text-2xl font-bold">Tester access</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Enter the tester password to preview every public feature before launch.
          </p>
          <div className="mt-6">
            <TesterLoginForm />
          </div>
        </div>
      </div>
    );
  }

  const groups = await featureGroups();

  return (
    <div className="container-pg py-12">
      <div className="flex flex-col gap-4 rounded-2xl border border-border bg-white p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Testing mode active</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {isPrelaunch()
              ? "This browser sees the site as post-launch. Everyone else still sees the prelaunch pages."
              : "The site is already launched, so testing mode changes nothing right now."}
          </p>
        </div>
        <ExitTestingButton />
      </div>

      <p className="mt-6 text-sm text-muted-foreground">
        Saving, enquiries, chat and visit booking need an OTP login. Log in from the Account
        section, then come back here.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {groups.map((group) => (
          <Card key={group.title}>
            <CardHeader>
              <h2 className="text-lg font-semibold">{group.title}</h2>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {group.links.map((link) => (
                  <li key={`${link.href}-${link.label}`}>
                    <Link
                      href={link.href}
                      className="flex items-center justify-between gap-3 rounded-xl px-3 py-2 text-sm font-medium hover:bg-slate-50"
                    >
                      <span>{link.label}</span>
                      {link.note ? (
                        <span className="text-xs font-normal text-muted-foreground">{link.note}</span>
                      ) : null}
                    </Link>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
