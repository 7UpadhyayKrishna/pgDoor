import { Suspense } from "react";
import type { Metadata } from "next";
import { CompareView } from "@/components/compare/compare-view";

export const metadata: Metadata = {
  title: "Compare PGs",
  description: "Compare two PGs side by side and see how well each matches your requirements.",
};

export default function ComparePage() {
  return (
    <div className="container-pg py-8 pb-24 md:py-12">
      <h1 className="text-2xl font-bold text-ink sm:text-3xl">Compare PGs</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        See two PGs side by side, scored against what you need.
      </p>
      <div className="mt-6">
        <Suspense fallback={null}>
          <CompareView />
        </Suspense>
      </div>
    </div>
  );
}
