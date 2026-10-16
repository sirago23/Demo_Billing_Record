"use client";

import { CircleAlert, CircleCheck } from "lucide-react";
import { useState } from "react";
import { categoriesFor, RECORD_TYPES, type RecordType } from "@/lib/categories";
import { recordInputSchema } from "@/lib/validation";
import { Button } from "./ui/Button";
import { CONTROL_CLASS, Field, SelectField } from "./ui/Field";

export type RecordFormValues = {
  type: RecordType;
  amount: string;
  date: string;
  category: string;
  merchant: string;
  note: string;
};

type Props = {
  initial?: Partial<RecordFormValues>;
  source?: "manual" | "slip";
  /** When set, Save updates this record (PATCH) instead of creating one. */
  recordId?: number;
  onSaved?: () => void;
  /** When set, a Cancel button is shown next to Save. */
  onCancel?: () => void;
};

function todayLocal(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function RecordForm({ initial, source = "manual", recordId, onSaved, onCancel }: Props) {
  const [values, setValues] = useState<RecordFormValues>({
    type: initial?.type ?? "expense",
    amount: initial?.amount ?? "",
    date: initial?.date ?? todayLocal(),
    category: initial?.category ?? categoriesFor(initial?.type ?? "expense")[0],
    merchant: initial?.merchant ?? "",
    note: initial?.note ?? "",
  });
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  function update<K extends keyof RecordFormValues>(key: K, value: RecordFormValues[K]) {
    setValues((v) => ({ ...v, [key]: value }));
    setSaved(false);
  }

  function changeType(type: RecordType) {
    setValues((v) => ({
      ...v,
      type,
      category: categoriesFor(type).includes(v.category) ? v.category : categoriesFor(type)[0],
    }));
    setSaved(false);
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setSaved(false);

    const amountText = values.amount.trim();
    if (amountText === "") return setError("Amount is required");
    const payload = {
      type: values.type,
      amount: Number(amountText),
      date: values.date,
      category: values.category,
      merchant: values.merchant,
      note: values.note,
    };
    if (Number.isNaN(payload.amount)) return setError("Amount must be a number");
    const check = recordInputSchema.safeParse(payload);
    if (!check.success) return setError(check.error.issues[0].message);

    setSaving(true);
    try {
      const res = await fetch(recordId === undefined ? "/api/records" : `/api/records/${recordId}`, {
        method: recordId === undefined ? "POST" : "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...payload, source }),
      });
      if (!res.ok) {
        const body: { error?: string } = await res.json().catch(() => ({}));
        return setError(body.error ?? "Could not save the record");
      }
      setSaved(true);
      if (recordId === undefined) setValues((v) => ({ ...v, amount: "", merchant: "", note: "" }));
      onSaved?.();
    } catch {
      setError("Could not reach the server");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5" noValidate>
      <fieldset>
        <legend className="text-sm font-medium">Type</legend>
        <div className="mt-1 grid grid-cols-2 rounded-control border border-rule bg-paper p-[3px]">
          {RECORD_TYPES.map((t) => (
            <label
              key={t}
              className="grid min-h-[42px] cursor-pointer place-items-center rounded-segment font-medium text-muted capitalize has-checked:bg-sheet has-checked:text-ink has-checked:shadow-[0_0_0_1px_var(--color-rule)] has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-accent"
            >
              <input
                type="radio"
                name="type"
                value={t}
                checked={values.type === t}
                onChange={() => changeType(t)}
                className="sr-only"
              />
              {t}
            </label>
          ))}
        </div>
      </fieldset>

      <label className="block text-sm font-medium">
        Amount (THB)
        <span className="relative mt-1 block">
          <span aria-hidden className="absolute top-1/2 left-3.5 -translate-y-1/2 text-[1.375rem] text-muted">
            ฿
          </span>
          <input
            className={`${CONTROL_CLASS} min-h-[60px] pl-10 text-[1.75rem] font-semibold`}
            inputMode="decimal"
            placeholder="0.00"
            value={values.amount}
            onChange={(e) => update("amount", e.target.value)}
          />
        </span>
      </label>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          label="Date"
          type="date"
          value={values.date}
          onChange={(e) => update("date", e.target.value)}
          suppressHydrationWarning
        />
        <SelectField label="Category" value={values.category} onChange={(e) => update("category", e.target.value)}>
          {categoriesFor(values.type).map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </SelectField>
      </div>

      <Field label="Merchant / counterparty" value={values.merchant} onChange={(e) => update("merchant", e.target.value)} />
      <Field label="Note" value={values.note} onChange={(e) => update("note", e.target.value)} />

      {error && (
        <p role="alert" className="flex items-start gap-2 rounded-control bg-err-bg px-3 py-2.5 text-sm text-out">
          <CircleAlert aria-hidden size={18} className="mt-0.5 shrink-0" />
          {error}
        </p>
      )}
      {saved && (
        <p role="status" className="flex items-start gap-2 rounded-control bg-accent-soft px-3 py-2.5 text-sm text-in">
          <CircleCheck aria-hidden size={18} className="mt-0.5 shrink-0" />
          Record saved
        </p>
      )}

      <div className="flex gap-3 sm:justify-end">
        {onCancel && (
          <Button type="button" variant="secondary" onClick={onCancel} className="flex-1 sm:flex-none">
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={saving} className="flex-1 sm:flex-none sm:min-w-28">
          {saving ? "Saving..." : "Save"}
        </Button>
      </div>
    </form>
  );
}
