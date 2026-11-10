import type { ReactNode } from "react";

export function StaticPage({
  title,
  intro,
  updated,
  children,
}: {
  title: string;
  intro?: string;
  updated?: string;
  children: ReactNode;
}) {
  return (
    <div className="container-pg py-12 md:py-16">
      <h1 className="text-3xl font-bold text-ink">{title}</h1>
      {intro ? <p className="mt-2 max-w-2xl text-muted-foreground">{intro}</p> : null}
      {updated ? <p className="mt-1 text-xs text-muted-foreground">Last updated {updated}</p> : null}
      <div className="mt-8 max-w-3xl space-y-8 text-sm leading-6 text-ink/80">{children}</div>
    </div>
  );
}

export function StaticSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-2">
      <h2 className="text-lg font-semibold text-ink">{title}</h2>
      {children}
    </section>
  );
}
