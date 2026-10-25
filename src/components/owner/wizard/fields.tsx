"use client";

import type { ReactNode } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export function Field({
  label,
  hint,
  error,
  optional,
  children,
  htmlFor,
}: {
  label: string;
  hint?: string;
  error?: string;
  optional?: boolean;
  children: ReactNode;
  htmlFor?: string;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="block text-sm font-semibold text-ink">
        {label}
        {optional ? <span className="ml-1 font-normal text-muted-foreground">(optional)</span> : null}
      </label>
      {hint ? <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p> : null}
      <div className="mt-2">{children}</div>
      {error ? (
        <p role="alert" className="mt-1.5 text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}

type ChipOption<T extends string> = { value: T; label: string; icon?: ReactNode };

export function ChipGroup<T extends string>({
  options,
  value,
  onChange,
  columns = 2,
}: {
  options: ChipOption<T>[];
  value: T | "";
  onChange: (value: T) => void;
  columns?: 2 | 3 | 4;
}) {
  return (
    <div
      role="radiogroup"
      className={cn(
        "grid gap-2",
        columns === 2 && "grid-cols-2",
        columns === 3 && "grid-cols-3",
        columns === 4 && "grid-cols-2 sm:grid-cols-4",
      )}
    >
      {options.map((option) => (
        <Chip
          key={option.value}
          role="radio"
          selected={value === option.value}
          onClick={() => onChange(option.value)}
          icon={option.icon}
        >
          {option.label}
        </Chip>
      ))}
    </div>
  );
}

export function MultiChipGroup<T extends string>({
  options,
  value,
  onChange,
}: {
  options: ChipOption<T>[];
  value: T[];
  onChange: (value: T[]) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {options.map((option) => {
        const selected = value.includes(option.value);
        return (
          <Chip
            key={option.value}
            role="checkbox"
            selected={selected}
            icon={option.icon}
            onClick={() =>
              onChange(selected ? value.filter((v) => v !== option.value) : [...value, option.value])
            }
          >
            {option.label}
          </Chip>
        );
      })}
    </div>
  );
}

export function Chip({
  selected,
  onClick,
  icon,
  children,
  role,
}: {
  selected: boolean;
  onClick: () => void;
  icon?: ReactNode;
  children: ReactNode;
  role: "radio" | "checkbox";
}) {
  return (
    <button
      type="button"
      role={role}
      aria-checked={selected}
      onClick={onClick}
      className={cn(
        "relative flex min-h-12 items-center gap-2 rounded-[12px] border px-3 py-2 text-left text-sm font-medium transition-colors",
        selected
          ? "border-primary bg-primary-soft text-ink ring-1 ring-primary"
          : "border-border bg-white text-ink/80 hover:border-ink/30",
      )}
    >
      {icon ? <span className="shrink-0 text-ink/70">{icon}</span> : null}
      <span className="min-w-0 flex-1">{children}</span>
      {selected ? <Check className="h-4 w-4 shrink-0 text-primary" /> : null}
    </button>
  );
}

export function ToggleRow({
  label,
  description,
  checked,
  onChange,
  icon,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  icon?: ReactNode;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex min-h-14 w-full items-center gap-3 rounded-[12px] border border-border bg-white px-3 py-2.5 text-left"
    >
      {icon ? <span className="shrink-0 text-ink/70">{icon}</span> : null}
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-ink">{label}</span>
        {description ? <span className="block text-xs text-muted-foreground">{description}</span> : null}
      </span>
      <span
        className={cn(
          "relative h-7 w-12 shrink-0 rounded-full transition-colors",
          checked ? "bg-primary" : "bg-slate-200",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform",
            checked ? "translate-x-[22px]" : "translate-x-0.5",
          )}
        />
      </span>
    </button>
  );
}

export function NumberInput({
  value,
  onChange,
  prefix,
  suffix,
  placeholder,
  id,
  invalid,
}: {
  value: string;
  onChange: (value: string) => void;
  prefix?: string;
  suffix?: string;
  placeholder?: string;
  id?: string;
  invalid?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex h-12 items-center rounded-[12px] border bg-white px-3 focus-within:ring-2 focus-within:ring-ring",
        invalid ? "border-destructive" : "border-input",
      )}
    >
      {prefix ? <span className="mr-1.5 text-sm text-muted-foreground">{prefix}</span> : null}
      <input
        id={id}
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        autoComplete="off"
        className="min-w-0 flex-1 bg-transparent text-base text-ink outline-none placeholder:text-muted-foreground"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value.replace(/[^\d]/g, "").slice(0, 7))}
      />
      {suffix ? <span className="ml-1.5 text-sm text-muted-foreground">{suffix}</span> : null}
    </div>
  );
}

export function Stepper({
  value,
  onChange,
  min = 0,
  max = 99,
  label,
}: {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  label: string;
}) {
  return (
    <div className="flex h-12 items-center justify-between rounded-[12px] border border-input bg-white">
      <button
        type="button"
        aria-label={`Decrease ${label}`}
        className="h-12 w-12 text-xl font-semibold text-ink disabled:opacity-30"
        disabled={value <= min}
        onClick={() => onChange(Math.max(min, value - 1))}
      >
        −
      </button>
      <span className="text-base font-semibold tabular-nums text-ink">{value}</span>
      <button
        type="button"
        aria-label={`Increase ${label}`}
        className="h-12 w-12 text-xl font-semibold text-ink disabled:opacity-30"
        disabled={value >= max}
        onClick={() => onChange(Math.min(max, value + 1))}
      >
        +
      </button>
    </div>
  );
}

export const textInputClass =
  "flex h-12 w-full rounded-[12px] border border-input bg-white px-3 text-base text-ink placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export const textAreaClass =
  "w-full rounded-[12px] border border-input bg-white px-3 py-2.5 text-base text-ink placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
