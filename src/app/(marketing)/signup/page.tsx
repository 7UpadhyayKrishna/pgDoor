import type { Metadata } from "next";
import Link from "next/link";
import { Building2, UserRound } from "lucide-react";
import { isPrelaunchForViewer } from "@/lib/launch-server";

export const metadata: Metadata = {
  title: "Sign up",
  description: "Create a pgDoor account as a tenant looking for a PG, or list your PG for free as an owner.",
};

export default async function SignupPage() {
  const prelaunch = await isPrelaunchForViewer();
  const options = [
    ...(prelaunch
      ? []
      : [
          {
            href: "/login",
            icon: UserRound,
            title: "I'm looking for a PG",
            body: "Sign up with your mobile number and a one-time code. No password needed.",
          },
        ]),
    {
      href: "/owners/register",
      icon: Building2,
      title: "I own or manage a PG",
      body: "List your PG for free in about 5 minutes and get enquiries from verified tenants.",
    },
  ];

  return (
    <div className="container-pg flex min-h-[70vh] items-center justify-center py-16">
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-bold">Create your pgDoor account</h1>
        <p className="mt-1 text-sm text-muted-foreground">Tell us who you are to get started.</p>
        <ul className="mt-6 space-y-3">
          {options.map((option) => (
            <li key={option.href}>
              <Link
                href={option.href}
                className="flex items-start gap-4 rounded-[20px] bg-white p-5 shadow-card ring-1 ring-transparent transition hover:ring-primary"
              >
                <option.icon className="mt-0.5 h-6 w-6 shrink-0 text-primary" />
                <span>
                  <span className="block font-semibold text-ink">{option.title}</span>
                  <span className="mt-1 block text-sm text-muted-foreground">{option.body}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
        <p className="mt-6 text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
