"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { draftToPayload, emptyDraft, validateStep, type ListingDraft, type StepErrors } from "./draft";
import { useListingDraft } from "./use-listing-draft";
import { StepBasics } from "./step-basics";
import { StepLocation, type WizardCity } from "./step-location";
import { StepRooms } from "./step-rooms";
import { StepCharges } from "./step-charges";
import { StepAmenities, type WizardAmenity } from "./step-amenities";
import { StepPhotos } from "./step-photos";
import { StepReview } from "./step-review";
import { OwnerOtp } from "./owner-otp";

const STEPS = [
  { title: "Basics", subtitle: "Tell tenants about your PG" },
  { title: "Location", subtitle: "Where is your PG?" },
  { title: "Rooms & rent", subtitle: "Sharing types, rent and available beds" },
  { title: "Charges & food", subtitle: "Extra charges, meals and stay terms" },
  { title: "Amenities & rules", subtitle: "Facilities and house rules" },
  { title: "Photos", subtitle: "Show tenants the real place" },
  { title: "Review", subtitle: "Check everything before you submit" },
];

const DRAFT_KEY = "pgdoor:listing-draft";

type Props = {
  cities: WizardCity[];
  amenities: WizardAmenity[];
  loggedIn: boolean;
  launchLabel: string;
} & ({ mode: "create" } | { mode: "edit"; propertyId: string; initialDraft: ListingDraft });

export function ListingWizard(props: Props) {
  const { cities, amenities, loggedIn, launchLabel } = props;
  const router = useRouter();
  const editing = props.mode === "edit";
  const { draft, update, step, setStep, clear, hydrated } = useListingDraft(
    editing ? null : DRAFT_KEY,
    editing ? props.initialDraft : emptyDraft(),
  );
  const [errors, setErrors] = useState<StepErrors>({});
  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(0);
  const [done, setDone] = useState(false);
  const [verified, setVerified] = useState(false);
  const topRef = useRef<HTMLDivElement>(null);
  const shownStep = useRef<number | null>(null);
  const last = STEPS.length - 1;

  const onUploadingChange = useCallback((count: number) => setUploading(count), []);

  useEffect(() => {
    if (!hydrated) return;
    if (shownStep.current !== null && shownStep.current !== step) {
      topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    shownStep.current = step;
  }, [step, hydrated]);

  function goTo(target: number) {
    setErrors({});
    setSubmitError("");
    setStep(target);
  }

  function next() {
    const stepErrors = validateStep(step, draft);
    if (step === 5 && uploading) stepErrors.photos = "Wait for your photos to finish uploading";
    setErrors(stepErrors);
    if (Object.keys(stepErrors).length) return;
    goTo(Math.min(step + 1, last));
  }

  function firstInvalidStep() {
    for (let i = 0; i <= last; i += 1) {
      if (Object.keys(validateStep(i, draft)).length) return i;
    }
    return -1;
  }

  async function submit() {
    const invalid = firstInvalidStep();
    if (invalid !== -1) {
      setStep(invalid);
      setErrors(validateStep(invalid, draft));
      return;
    }
    setSubmitting(true);
    setSubmitError("");
    try {
      const res = await fetch(editing ? `/api/owners/properties/${props.propertyId}` : "/api/owners/properties", {
        method: editing ? "PATCH" : "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(draftToPayload(draft)),
      });
      const data = await res.json();
      if (!res.ok) {
        setSubmitError(data.error ?? "Could not save your listing. Please try again.");
        return;
      }
      if (editing) {
        router.push("/owners/properties?saved=1");
        router.refresh();
        return;
      }
      clear();
      setDone(true);
      router.refresh();
    } catch {
      setSubmitError("Could not save your listing. Check your internet connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="rounded-[24px] bg-white p-6 text-center shadow-card sm:p-10">
        <CheckCircle2 className="mx-auto h-14 w-14 text-primary" />
        <h2 className="mt-4 text-2xl font-bold text-ink">Your PG is submitted!</h2>
        <p className="mx-auto mt-2 max-w-md text-ink/70">
          Our team will review it shortly. Tenants will be able to find it when pgDoor goes live on {launchLabel}.
        </p>
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <Button asChild size="lg">
            <Link href="/owners/properties">View my listings</Link>
          </Button>
          <Button size="lg" variant="outline" onClick={() => setDone(false)}>
            List another PG
          </Button>
        </div>
      </div>
    );
  }

  if (!hydrated) {
    return <div className="h-96 animate-pulse rounded-[24px] bg-white" />;
  }

  const current = STEPS[step];
  const stepProps = { draft, update, errors };

  return (
    <div ref={topRef} className="scroll-mt-20 pb-28 md:pb-0">
      <div className="mb-5">
        <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
          <span>
            Step {step + 1} of {STEPS.length}
          </span>
          {!editing ? <span>Saved on this device</span> : null}
        </div>
        <div className="mt-2 flex gap-1">
          {STEPS.map((s, i) => (
            <button
              key={s.title}
              type="button"
              aria-label={`Step ${i + 1}: ${s.title}`}
              aria-current={i === step ? "step" : undefined}
              disabled={i > step && !editing}
              onClick={() => goTo(i)}
              className={cn("h-1.5 flex-1 rounded-full transition-colors", i <= step ? "bg-primary" : "bg-slate-200")}
            />
          ))}
        </div>
        <h2 className="mt-4 text-2xl font-bold text-ink">{current.title}</h2>
        <p className="text-sm text-muted-foreground">{current.subtitle}</p>
      </div>

      <div className="rounded-[24px] bg-white p-4 shadow-card sm:p-6">
        {step === 0 ? <StepBasics {...stepProps} /> : null}
        {step === 1 ? <StepLocation {...stepProps} cities={cities} /> : null}
        {step === 2 ? <StepRooms {...stepProps} /> : null}
        {step === 3 ? <StepCharges {...stepProps} /> : null}
        {step === 4 ? <StepAmenities {...stepProps} amenities={amenities} /> : null}
        {step === 5 ? <StepPhotos {...stepProps} onUploadingChange={onUploadingChange} /> : null}
        {step === 6 ? (
          <StepReview {...stepProps} onEdit={goTo} cities={cities} amenities={amenities} />
        ) : null}

        {step === last ? (
          <div className="mt-6 border-t border-border pt-6">
            {submitError ? (
              <p role="alert" className="mb-4 text-sm text-destructive">
                {submitError}
              </p>
            ) : null}
            {loggedIn || editing || verified ? (
              <Button type="button" size="lg" className="w-full" onClick={submit} disabled={submitting}>
                {submitting ? "Saving…" : editing ? "Save changes" : "Submit listing for free"}
              </Button>
            ) : (
              <div>
                <h3 className="font-semibold text-ink">Verify your phone to submit</h3>
                <p className="mb-4 mt-1 text-sm text-muted-foreground">
                  Use this number to log in later and manage your listing.
                </p>
                <OwnerOtp
                  onVerified={async () => {
                    setVerified(true);
                    await submit();
                  }}
                  busy={submitting}
                  submitLabel="Verify & submit listing"
                />
              </div>
            )}
          </div>
        ) : null}
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-white p-3 md:static md:mt-6 md:border-0 md:bg-transparent md:p-0">
        <div className="mx-auto flex max-w-2xl gap-3">
          <Button
            type="button"
            size="lg"
            variant="outline"
            className="flex-1 md:flex-none"
            disabled={step === 0}
            onClick={() => goTo(step - 1)}
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          {step < last ? (
            <Button type="button" size="lg" className="flex-[2] md:ml-auto md:flex-none" onClick={next}>
              Continue
              <ArrowRight className="h-4 w-4" />
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
