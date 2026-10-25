"use client";

import type { ReactNode } from "react";
import { Coffee, Moon, Sun, UtensilsCrossed } from "lucide-react";
import type { ElectricityMode, Meal } from "./draft";
import { ChipGroup, Field, MultiChipGroup, NumberInput, ToggleRow, textInputClass } from "./fields";
import type { StepProps } from "./step-basics";

const ELECTRICITY: { value: ElectricityMode; label: string }[] = [
  { value: "INCLUDED", label: "Included" },
  { value: "METER", label: "As per meter" },
  { value: "FIXED", label: "Fixed monthly" },
];

const MEAL_OPTIONS: { value: Meal; label: string; icon: ReactNode }[] = [
  { value: "BREAKFAST", label: "Breakfast", icon: <Coffee className="h-4 w-4" /> },
  { value: "LUNCH", label: "Lunch", icon: <Sun className="h-4 w-4" /> },
  { value: "DINNER", label: "Dinner", icon: <Moon className="h-4 w-4" /> },
];

const NOTICE = ["0", "15", "30", "60"] as const;

function todayIst() {
  return new Date(Date.now() + 330 * 60 * 1000).toISOString().slice(0, 10);
}

export function StepCharges({ draft, update, errors }: StepProps) {
  return (
    <div className="space-y-6">
      <section className="space-y-4">
        <h3 className="text-base font-semibold text-ink">Monthly charges</h3>
        <Field label="Maintenance" optional hint="Per month, on top of rent. Leave empty if none.">
          <NumberInput
            prefix="₹"
            suffix="/ month"
            value={draft.maintenanceCharge}
            placeholder="0"
            onChange={(maintenanceCharge) => update({ maintenanceCharge })}
          />
        </Field>
        <Field label="Electricity">
          <ChipGroup
            options={ELECTRICITY}
            value={draft.electricity}
            onChange={(electricity) => update({ electricity })}
            columns={3}
          />
          {draft.electricity !== "INCLUDED" ? (
            <div className="mt-3">
              <NumberInput
                prefix="₹"
                suffix={draft.electricity === "METER" ? "/ unit" : "/ month"}
                value={draft.electricityAmount}
                placeholder={draft.electricity === "METER" ? "e.g. 9" : "e.g. 1000"}
                onChange={(electricityAmount) => update({ electricityAmount })}
              />
            </div>
          ) : null}
        </Field>
      </section>

      <section className="space-y-4">
        <h3 className="text-base font-semibold text-ink">Food</h3>
        <ToggleRow
          label="Food is included"
          description="Meals are part of the rent"
          icon={<UtensilsCrossed className="h-5 w-5" />}
          checked={draft.foodIncluded}
          onChange={(foodIncluded) =>
            update({
              foodIncluded,
              meals: foodIncluded && !draft.meals.length ? ["BREAKFAST", "DINNER"] : draft.meals,
            })
          }
        />
        {draft.foodIncluded ? (
          <>
            <Field label="Meals served" error={errors.meals}>
              <MultiChipGroup options={MEAL_OPTIONS} value={draft.meals} onChange={(meals) => update({ meals })} />
            </Field>
            <div className="grid gap-2 sm:grid-cols-2">
              <ToggleRow
                label="Vegetarian"
                checked={draft.vegetarianFood}
                onChange={(vegetarianFood) => update({ vegetarianFood })}
              />
              <ToggleRow
                label="Non-vegetarian"
                checked={draft.nonVegetarianFood}
                onChange={(nonVegetarianFood) => update({ nonVegetarianFood })}
              />
            </div>
          </>
        ) : null}
      </section>

      <section className="space-y-4">
        <h3 className="text-base font-semibold text-ink">Stay terms</h3>
        <Field label="Notice period" error={errors.noticePeriodDays}>
          <div className="grid grid-cols-4 gap-2">
            {NOTICE.map((days) => (
              <button
                key={days}
                type="button"
                aria-pressed={draft.noticePeriodDays === days}
                onClick={() => update({ noticePeriodDays: days })}
                className={`min-h-12 rounded-[12px] border text-sm font-medium ${
                  draft.noticePeriodDays === days
                    ? "border-primary bg-primary-soft ring-1 ring-primary"
                    : "border-border bg-white"
                }`}
              >
                {days === "0" ? "None" : `${days} days`}
              </button>
            ))}
          </div>
        </Field>
        <Field label="Lock-in period" optional hint="Minimum months a tenant must stay" error={errors.lockInMonths}>
          <NumberInput
            suffix="months"
            value={draft.lockInMonths}
            placeholder="0"
            onChange={(lockInMonths) => update({ lockInMonths })}
          />
        </Field>
        <Field label="Beds available from" optional hint="Leave empty if tenants can move in right away" htmlFor="move-in">
          <input
            id="move-in"
            type="date"
            min={todayIst()}
            className={textInputClass}
            value={draft.moveInFrom}
            onChange={(e) => update({ moveInFrom: e.target.value })}
          />
        </Field>
      </section>
    </div>
  );
}
