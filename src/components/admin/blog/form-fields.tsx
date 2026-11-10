"use client";

import { Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

export const inputClass =
  "h-10 w-full rounded-[10px] border border-input bg-white px-3 text-sm text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
export const textareaClass =
  "min-h-20 w-full rounded-[10px] border border-input bg-white px-3 py-2 text-sm text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export function Field({
  id,
  label,
  hint,
  count,
  range,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  count?: number;
  /** Ideal [min, max] for the counter colour. */
  range?: [number, number];
  children: React.ReactNode;
}) {
  const tone =
    count === undefined || !range
      ? "text-muted-foreground"
      : count === 0
        ? "text-muted-foreground"
        : count >= range[0] && count <= range[1]
          ? "text-success"
          : "text-warning";
  return (
    <div id={`field-${id}`} className="scroll-mt-28 space-y-1.5">
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={`input-${id}`} className="text-sm font-medium text-ink">
          {label}
        </label>
        {count !== undefined ? (
          <span className={cn("text-xs tabular-nums", tone)}>
            {count}
            {range ? ` / ${range[0]}–${range[1]}` : ""}
          </span>
        ) : null}
      </div>
      {children}
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

export function StringList({
  id,
  values,
  onChange,
  placeholder,
  addLabel,
}: {
  id: string;
  values: string[];
  onChange: (values: string[]) => void;
  placeholder: string;
  addLabel: string;
}) {
  return (
    <div className="space-y-2">
      {values.map((value, i) => (
        <div key={i} className="flex gap-2">
          <input
            id={i === 0 ? `input-${id}` : undefined}
            className={inputClass}
            value={value}
            placeholder={placeholder}
            onChange={(e) => onChange(values.map((v, j) => (j === i ? e.target.value : v)))}
          />
          <IconRemove onClick={() => onChange(values.filter((_, j) => j !== i))} />
        </div>
      ))}
      <AddButton onClick={() => onChange([...values, ""])}>{addLabel}</AddButton>
    </div>
  );
}

export type RepeaterColumn<T> = {
  key: keyof T & string;
  label: string;
  placeholder?: string;
  multiline?: boolean;
  type?: "text" | "url" | "date";
  width?: "full" | "half";
};

export function Repeater<T extends Record<string, unknown>>({
  id,
  items,
  onChange,
  columns,
  empty,
  addLabel,
}: {
  id: string;
  items: T[];
  onChange: (items: T[]) => void;
  columns: RepeaterColumn<T>[];
  empty: T;
  addLabel: string;
}) {
  const update = (i: number, key: keyof T, value: string) =>
    onChange(items.map((item, j) => (j === i ? { ...item, [key]: value } : item)));
  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <div key={i} className="rounded-[14px] border border-border bg-canvas/60 p-3">
          <div className="mb-2 flex items-center justify-between text-xs font-medium text-muted-foreground">
            <span>#{i + 1}</span>
            <div className="flex gap-1">
              <button
                type="button"
                disabled={i === 0}
                className="rounded px-1.5 py-0.5 hover:bg-white disabled:opacity-30"
                onClick={() => {
                  const next = [...items];
                  [next[i - 1], next[i]] = [next[i], next[i - 1]];
                  onChange(next);
                }}
              >
                ↑
              </button>
              <IconRemove onClick={() => onChange(items.filter((_, j) => j !== i))} />
            </div>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {columns.map((col) => {
              const value = String(item[col.key] ?? "");
              const props = {
                id: i === 0 && col === columns[0] ? `input-${id}` : undefined,
                value,
                placeholder: col.placeholder ?? col.label,
                "aria-label": `${col.label} ${i + 1}`,
              };
              return (
                <div key={col.key} className={col.width === "half" ? "" : "sm:col-span-2"}>
                  {col.multiline ? (
                    <textarea {...props} className={textareaClass} onChange={(e) => update(i, col.key, e.target.value)} />
                  ) : (
                    <input
                      {...props}
                      type={col.type ?? "text"}
                      className={inputClass}
                      onChange={(e) => update(i, col.key, e.target.value)}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
      <AddButton onClick={() => onChange([...items, { ...empty }])}>{addLabel}</AddButton>
    </div>
  );
}

function IconRemove({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label="Remove"
      onClick={onClick}
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] text-muted-foreground hover:bg-white hover:text-error"
    >
      <Trash2 className="h-4 w-4" />
    </button>
  );
}

function AddButton({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-[10px] px-2 py-1.5 text-sm font-semibold text-primary hover:bg-primary-soft"
    >
      <Plus className="h-4 w-4" /> {children}
    </button>
  );
}
