"use client";

import { EnquirySheet } from "@/components/listing/enquiry-dialog";
import { NotifyButton } from "@/components/listing/notify-button";
import { VisitSheet } from "@/components/listing/visit-sheet";
import { formatInr } from "@/lib/format";

export function StickyCta({
  propertyId,
  propertyName,
  slug,
  minRent,
  full,
}: {
  propertyId: string;
  propertyName: string;
  slug: string;
  minRent: number;
  /** No free beds: lead with a bed-opening alert instead of a visit booking. */
  full: boolean;
}) {
  return (
    <>
      <section
        aria-label={`Contact ${propertyName}`}
        className="sticky top-24 hidden h-fit rounded-[20px] bg-white p-5 shadow-card lg:block"
      >
        <p className="text-2xl font-bold text-ink">
          {formatInr(minRent)}
          <span className="text-sm font-medium text-muted-foreground">/month</span>
        </p>
        {full ? (
          <p className="mt-1 text-sm text-muted-foreground">
            Currently full. Get an alert as soon as a bed opens.
          </p>
        ) : null}
        <div className="mt-4 space-y-2">
          {full ? (
            <>
              <NotifyButton slug={slug} />
              <EnquirySheet propertyId={propertyId} propertyName={propertyName} triggerClassName="w-full" />
            </>
          ) : (
            <>
              <EnquirySheet propertyId={propertyId} propertyName={propertyName} triggerClassName="w-full" />
              <VisitSheet propertyId={propertyId} triggerClassName="w-full" />
            </>
          )}
        </div>
      </section>
      <section
        aria-label={`Contact ${propertyName}`}
        className="fixed inset-x-0 bottom-14 z-30 border-t border-border bg-white p-3 md:bottom-0 lg:hidden"
        style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
      >
        <div className="mx-auto flex max-w-lg flex-wrap items-center gap-2 sm:max-w-none">
          <p className="min-w-0 shrink-0 truncate font-bold text-ink">{formatInr(minRent)}/mo</p>
          {full ? (
            <>
              <NotifyButton slug={slug} className="flex-[2]" />
              <EnquirySheet propertyId={propertyId} propertyName={propertyName} triggerClassName="min-w-0 flex-1" />
            </>
          ) : (
            <>
              <EnquirySheet propertyId={propertyId} propertyName={propertyName} triggerClassName="min-w-0 flex-1" />
              <VisitSheet propertyId={propertyId} triggerClassName="min-w-0 flex-1" />
            </>
          )}
        </div>
      </section>
    </>
  );
}
