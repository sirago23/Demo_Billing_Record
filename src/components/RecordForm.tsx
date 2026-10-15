"use client";

import { useState } from "react";
import { categoriesFor, RECORD_TYPES, type RecordType } from "@/lib/categories";
import { recordInputSchema } from "@/lib/validation";

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
};

function todayLocal(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

const inputClass = "mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2";

export function RecordForm({ initial, source = "manual", recordId, onSaved }: Props) {
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
    <form onSubmit={submit} className="space-y-4" noValidate>
      <fieldset>
        <legend className="text-sm font-medium">Type</legend>
        <div className="mt-1 flex gap-4">
          {RECORD_TYPES.map((t) => (
            <label key={t} className="flex items-center gap-2 capitalize">
              <input
                type="radio"
                name="type"
                value={t}
                checked={values.type === t}
                onChange={() => changeType(t)}
              />
              {t}
            </label>
          ))}
        </div>
      </fieldset>

      <label className="block text-sm font-medium">
        Amount (THB)
        <input
          className={inputClass}
          inputMode="decimal"
          placeholder="0.00"
          value={values.amount}
          onChange={(e) => update("amount", e.target.value)}
        />
      </label>

      <label className="block text-sm font-medium">
        Date
        <input
          type="date"
          className={inputClass}
          value={values.date}
          onChange={(e) => update("date", e.target.value)}
          suppressHydrationWarning
        />
      </label>

      <label className="block text-sm font-medium">
        Category
        <select
          className={inputClass}
          value={values.category}
          onChange={(e) => update("category", e.target.value)}
        >
          {categoriesFor(values.type).map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </label>

      <label className="block text-sm font-medium">
        Merchant / counterparty
        <input
          className={inputClass}
          value={values.merchant}
          onChange={(e) => update("merchant", e.target.value)}
        />
      </label>

      <label className="block text-sm font-medium">
        Note
        <input
          className={inputClass}
          value={values.note}
          onChange={(e) => update("note", e.target.value)}
        />
      </label>

      {error && (
        <p role="alert" className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
      {saved && (
        <p role="status" className="rounded bg-green-50 px-3 py-2 text-sm text-green-700">
          Record saved
        </p>
      )}

      <button
        type="submit"
        disabled={saving}
        className="rounded bg-slate-900 px-4 py-2 text-white disabled:opacity-50"
      >
        {saving ? "Saving..." : "Save"}
      </button>
    </form>
  );
}
