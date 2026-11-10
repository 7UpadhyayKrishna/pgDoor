"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ProspectSource } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { SOURCE_LABEL } from "@/lib/crm-labels";

export type ProspectFormCity = { id: string; name: string; areas: { id: string; name: string }[] };
export type ProspectFormAdmin = { id: string; name: string | null; phone: string };

export type ProspectFormValues = {
  name: string;
  phone: string;
  businessName: string;
  pgName: string;
  cityId: string;
  areaId: string;
  address: string;
  approxBeds: string;
  source: ProspectSource;
  assignedToId: string;
};

const EMPTY: ProspectFormValues = {
  name: "",
  phone: "",
  businessName: "",
  pgName: "",
  cityId: "",
  areaId: "",
  address: "",
  approxBeds: "",
  source: "FIELD_VISIT",
  assignedToId: "",
};

const selectClass = "mt-2 h-10 w-full rounded-xl border border-border bg-white px-3 text-sm";

type Props = {
  cities: ProspectFormCity[];
  admins: ProspectFormAdmin[];
  prospectId?: string;
  initial?: ProspectFormValues;
  defaultAssigneeId?: string;
  onSaved?: (id: string) => void;
};

export function ProspectForm({ cities, admins, prospectId, initial, defaultAssigneeId, onSaved }: Props) {
  const router = useRouter();
  const [values, setValues] = useState<ProspectFormValues>(
    initial ?? { ...EMPTY, assignedToId: defaultAssigneeId ?? "" },
  );
  const [error, setError] = useState("");
  const [warning, setWarning] = useState("");
  const [saving, setSaving] = useState(false);
  const areas = cities.find((c) => c.id === values.cityId)?.areas ?? [];

  function set<K extends keyof ProspectFormValues>(key: K, value: ProspectFormValues[K]) {
    setValues((curr) => ({ ...curr, [key]: value, ...(key === "cityId" ? { areaId: "" } : {}) }));
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setWarning("");
    const res = await fetch(prospectId ? `/api/admin/crm/prospects/${prospectId}` : "/api/admin/crm/prospects", {
      method: prospectId ? "PATCH" : "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        ...values,
        approxBeds: values.approxBeds ? Number(values.approxBeds) : undefined,
      }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setError(data.error ?? "Could not save prospect");
      return;
    }
    if (data.existingOwner) {
      setWarning(
        `Heads up: ${data.existingOwner.name ?? data.existingOwner.phone} already has an owner account on pgDoor.`,
      );
    }
    router.refresh();
    onSaved?.(data.prospect.id);
  }

  return (
    <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
      <div>
        <Label htmlFor="p-name">Owner name</Label>
        <Input id="p-name" className="mt-2" value={values.name} onChange={(e) => set("name", e.target.value)} />
      </div>
      <div>
        <Label htmlFor="p-phone">Mobile</Label>
        <Input
          id="p-phone"
          className="mt-2"
          placeholder="10-digit mobile"
          value={values.phone}
          onChange={(e) => set("phone", e.target.value)}
        />
      </div>
      <div>
        <Label htmlFor="p-pg">PG name</Label>
        <Input id="p-pg" className="mt-2" value={values.pgName} onChange={(e) => set("pgName", e.target.value)} />
      </div>
      <div>
        <Label htmlFor="p-biz">Business name</Label>
        <Input
          id="p-biz"
          className="mt-2"
          value={values.businessName}
          onChange={(e) => set("businessName", e.target.value)}
        />
      </div>
      <div>
        <Label htmlFor="p-city">City</Label>
        <select id="p-city" className={selectClass} value={values.cityId} onChange={(e) => set("cityId", e.target.value)}>
          <option value="">—</option>
          {cities.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <Label htmlFor="p-area">Area</Label>
        <select
          id="p-area"
          className={selectClass}
          value={values.areaId}
          disabled={!areas.length}
          onChange={(e) => set("areaId", e.target.value)}
        >
          <option value="">—</option>
          {areas.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
      </div>
      <div className="sm:col-span-2">
        <Label htmlFor="p-address">Address</Label>
        <Input id="p-address" className="mt-2" value={values.address} onChange={(e) => set("address", e.target.value)} />
      </div>
      <div>
        <Label htmlFor="p-beds">Approx. beds</Label>
        <Input
          id="p-beds"
          className="mt-2"
          inputMode="numeric"
          value={values.approxBeds}
          onChange={(e) => set("approxBeds", e.target.value.replace(/\D/g, ""))}
        />
      </div>
      <div>
        <Label htmlFor="p-source">Source</Label>
        <select
          id="p-source"
          className={selectClass}
          value={values.source}
          onChange={(e) => set("source", e.target.value as ProspectSource)}
        >
          {(Object.keys(SOURCE_LABEL) as ProspectSource[]).map((s) => (
            <option key={s} value={s}>
              {SOURCE_LABEL[s]}
            </option>
          ))}
        </select>
      </div>
      <div className="sm:col-span-2">
        <Label htmlFor="p-assignee">Assigned to</Label>
        <select
          id="p-assignee"
          className={selectClass}
          value={values.assignedToId}
          onChange={(e) => set("assignedToId", e.target.value)}
        >
          <option value="">Unassigned</option>
          {admins.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name ?? a.phone}
            </option>
          ))}
        </select>
      </div>
      {error ? <p className="text-sm text-destructive sm:col-span-2">{error}</p> : null}
      {warning ? <p className="text-sm text-amber-700 sm:col-span-2">{warning}</p> : null}
      <div className="sm:col-span-2">
        <Button type="submit" disabled={saving}>
          {saving ? "Saving…" : prospectId ? "Save changes" : "Add prospect"}
        </Button>
      </div>
    </form>
  );
}

export function AddProspectDialog(props: Omit<Props, "prospectId" | "initial" | "onSaved">) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>+ Add prospect</Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogTitle>New owner prospect</DialogTitle>
        <div className="mt-4">
          <ProspectForm
            {...props}
            onSaved={(id) => {
              setOpen(false);
              router.push(`/admin/crm/${id}`);
            }}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
