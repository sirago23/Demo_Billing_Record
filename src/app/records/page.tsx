"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { LogoutButton } from "@/components/LogoutButton";
import { MonthPicker, currentMonth } from "@/components/MonthPicker";
import { RecordForm } from "@/components/RecordForm";
import { formatBaht } from "@/lib/money";

type Row = {
  id: number;
  type: "income" | "expense";
  amountSatang: number;
  date: string;
  category: string;
  merchant: string | null;
  note: string | null;
};

export default function RecordsPage() {
  const [month, setMonth] = useState(currentMonth);
  const [rows, setRows] = useState<Row[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Row | null>(null);

  const load = useCallback(async (m: string) => {
    try {
      const res = await fetch(`/api/records?month=${m}`);
      const body: { records?: Row[]; error?: string } = await res.json();
      if (!res.ok || !body.records) throw new Error(body.error ?? "Could not load records");
      setRows(body.records);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load records");
    }
  }, []);

  useEffect(() => {
    setEditing(null);
    setRows(null);
    void load(month);
  }, [month, load]);

  async function remove(row: Row) {
    if (!window.confirm(`Delete this record (${formatBaht(row.amountSatang)}, ${row.category})?`)) return;
    const res = await fetch(`/api/records/${row.id}`, { method: "DELETE" });
    if (!res.ok) {
      const body: { error?: string } = await res.json().catch(() => ({}));
      return setError(body.error ?? "Could not delete the record");
    }
    await load(month);
  }

  return (
    <main className="mx-auto max-w-4xl p-4 sm:p-8">
      <Link href="/" className="text-sm text-slate-600 underline">
        Back to dashboard
      </Link>
      <div className="mt-2 mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Records</h1>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <MonthPicker value={month} onChange={setMonth} />
          <Link href="/records/new" className="rounded bg-slate-900 px-3 py-1.5 text-sm whitespace-nowrap text-white">
            Add record
          </Link>
          <LogoutButton />
        </div>
      </div>

      {error && (
        <p role="alert" className="mb-4 rounded bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      {editing && (
        <section className="mb-6 rounded border border-slate-300 bg-white p-4">
          <h2 className="mb-3 font-medium">Edit record</h2>
          <RecordForm
            key={editing.id}
            recordId={editing.id}
            initial={{
              type: editing.type,
              amount: String(editing.amountSatang / 100),
              date: editing.date,
              category: editing.category,
              merchant: editing.merchant ?? "",
              note: editing.note ?? "",
            }}
            onSaved={() => {
              setEditing(null);
              void load(month);
            }}
          />
          <button type="button" onClick={() => setEditing(null)} className="mt-3 text-sm underline">
            Cancel
          </button>
        </section>
      )}

      {rows === null ? (
        !error && <p className="text-slate-600">Loading...</p>
      ) : rows.length === 0 ? (
        <p className="text-slate-600">No records for this month.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-300">
                <th className="py-2 pr-3">Date</th>
                <th className="py-2 pr-3">Type</th>
                <th className="py-2 pr-3">Category</th>
                <th className="py-2 pr-3">Merchant</th>
                <th className="py-2 pr-3 text-right">Amount</th>
                <th className="py-2" />
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-slate-200">
                  <td className="py-2 pr-3">{r.date}</td>
                  <td className="py-2 pr-3 capitalize">{r.type}</td>
                  <td className="py-2 pr-3">{r.category}</td>
                  <td className="py-2 pr-3">{r.merchant}</td>
                  <td className={`py-2 pr-3 text-right ${r.type === "income" ? "text-green-700" : ""}`}>
                    {formatBaht(r.amountSatang)}
                  </td>
                  <td className="py-2 text-right whitespace-nowrap">
                    <button type="button" onClick={() => setEditing(r)} className="mr-3 underline">
                      Edit
                    </button>
                    <button type="button" onClick={() => remove(r)} className="text-red-700 underline">
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
