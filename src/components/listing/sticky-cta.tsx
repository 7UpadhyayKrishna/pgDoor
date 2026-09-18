"use client";

import { EnquirySheet } from "@/components/listing/enquiry-dialog";
import { VisitSheet } from "@/components/listing/visit-sheet";
import { formatInr } from "@/lib/format";

export function StickyCta({
  propertyId,
  minRent,
}: {
  propertyId: string;
  propertyName: string;
  minRent: number;
}) {
  return (
    <>
      <div className="sticky top-24 hidden rounded-[20px] bg-white p-5 shadow-card lg:block">
        <p className="text-2xl font-bold text-ink">
          {formatInr(minRent)}
          <span className="text-sm font-medium text-muted-foreground">/month</span>
        </p>
        <div className="mt-4 space-y-2">
          <EnquirySheet propertyId={propertyId} triggerClassName="w-full" />
          <VisitSheet propertyId={propertyId} triggerClassName="w-full" />
        </div>
      </div>
      <div
        className="fixed inset-x-0 bottom-14 z-30 border-t border-border bg-white p-3 md:bottom-0 lg:hidden"
        style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
      >
        <div className="mx-auto flex max-w-lg flex-wrap items-center gap-2 sm:max-w-none">
          <p className="min-w-0 shrink-0 truncate font-bold text-ink">{formatInr(minRent)}/mo</p>
          <EnquirySheet propertyId={propertyId} triggerClassName="min-w-0 flex-1" />
          <VisitSheet propertyId={propertyId} triggerClassName="min-w-0 flex-1" />
        </div>
      </div>
    </>
  );
}
