"use client";

import { Inbox, Pencil, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { MonthPicker, currentMonth } from "@/components/MonthPicker";
import { RecordForm } from "@/components/RecordForm";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
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
  const [deleting, setDeleting] = useState<Row | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

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

  async function confirmDelete() {
    if (!deleting) return;
    setDeleteBusy(true);
    try {
      const res = await fetch(`/api/records/${deleting.id}`, { method: "DELETE" });
      if (!res.ok) {
        const body: { error?: string } = await res.json().catch(() => ({}));
        setError(body.error ?? "Could not delete the record");
      } else {
        await load(month);
      }
    } catch {
      setError("Could not reach the server");
    } finally {
      setDeleteBusy(false);
      setDeleting(null);
    }
  }

  const ACTION =
    "inline-flex min-h-11 items-center gap-1.5 rounded-control px-3 text-sm font-medium hover:bg-paper";

  return (
    <>
      <AppHeader />
      <main className="mx-auto max-w-4xl px-4 pt-6 pb-24 sm:px-8 tab:pb-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-lg font-semibold text-muted">Records</h1>
          <MonthPicker value={month} onChange={setMonth} />
        </div>

        {error && (
          <p role="alert" className="mb-4 rounded-control bg-err-bg px-3 py-2.5 text-sm text-out">
            {error}
          </p>
        )}

        {editing && (
          <section className="mb-6 rounded-panel border border-rule bg-sheet p-5 sm:p-7" aria-label="Edit record">
            <h2 className="mb-4 text-lg font-semibold">Edit record</h2>
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
              onCancel={() => setEditing(null)}
              onSaved={() => {
                setEditing(null);
                void load(month);
              }}
            />
          </section>
        )}

        {rows === null ? (
          !error && (
            <div role="status" aria-busy="true" className="rounded-panel border border-rule bg-sheet p-5">
              <span className="sr-only">Loading...</span>
              {[0, 1, 2].map((i) => (
                <div key={i} className="mb-3 h-6 animate-pulse rounded-control bg-paper last:mb-0 motion-reduce:animate-none" />
              ))}
            </div>
          )
        ) : rows.length === 0 ? (
          <section className="rounded-panel border border-dashed border-rule bg-sheet px-6 py-14 text-center">
            <Inbox aria-hidden className="mx-auto text-muted" size={32} />
            <p className="mt-3 text-lg font-semibold">No records for this month</p>
            <p className="mt-1 text-muted">Pick another month, or use Add record to put one in.</p>
          </section>
        ) : (
          <div className="overflow-hidden rounded-panel border border-rule bg-sheet">
            <table className="w-full text-left" role="table">
              <thead role="rowgroup" className="max-tab:sr-only">
                <tr role="row" className="border-b border-rule text-sm text-muted">
                  <th role="columnheader" className="px-4 py-3 font-medium">Date</th>
                  <th role="columnheader" className="px-3 py-3 font-medium">Type</th>
                  <th role="columnheader" className="px-3 py-3 font-medium">Category</th>
                  <th role="columnheader" className="px-3 py-3 font-medium">Merchant</th>
                  <th role="columnheader" className="px-3 py-3 text-right font-medium">Amount</th>
                  <th role="columnheader" className="px-4 py-3"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody role="rowgroup" className="max-tab:block">
                {rows.map((r) => (
                  <tr
                    key={r.id}
                    role="row"
                    className="border-b border-rule last:border-b-0 max-tab:flex max-tab:flex-wrap max-tab:items-baseline max-tab:gap-x-2 max-tab:px-4 max-tab:py-3"
                  >
                    <td role="cell" className="px-4 py-3.5 text-muted max-tab:p-0 max-tab:text-sm">{r.date}</td>
                    <td role="cell" className="px-3 py-3.5 capitalize max-tab:p-0 max-tab:text-sm max-tab:text-muted max-tab:before:mr-2 max-tab:before:content-['·']">
                      {r.type}
                    </td>
                    <td role="cell" className="px-3 py-3.5 max-tab:p-0 max-tab:text-sm max-tab:text-muted max-tab:before:mr-2 max-tab:before:content-['·']">
                      {r.category}
                    </td>
                    <td role="cell" className="px-3 py-3.5 max-tab:basis-full max-tab:p-0 max-tab:pt-1 max-tab:font-medium">
                      {r.merchant}
                    </td>
                    <td
                      role="cell"
                      className={`px-3 py-3.5 text-right font-semibold max-tab:flex-1 max-tab:p-0 max-tab:pt-1 max-tab:text-left max-tab:text-xl ${r.type === "income" ? "text-in" : "text-out"}`}
                    >
                      {formatBaht(r.amountSatang)}
                    </td>
                    <td role="cell" className="px-4 py-1.5 text-right whitespace-nowrap max-tab:ml-auto max-tab:p-0">
                      <button type="button" onClick={() => setEditing(r)} className={`${ACTION} text-accent`}>
                        <Pencil aria-hidden size={16} />
                        Edit
                      </button>
                      <button type="button" onClick={() => setDeleting(r)} className={`${ACTION} text-out`}>
                        <Trash2 aria-hidden size={16} />
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

      <ConfirmDialog
        open={deleting !== null}
        title="Delete this record?"
        confirmLabel="Delete"
        busy={deleteBusy}
        onConfirm={() => void confirmDelete()}
        onCancel={() => setDeleting(null)}
      >
        {deleting && (
          <p>
            {formatBaht(deleting.amountSatang)}, {deleting.category}
            {deleting.merchant ? `, ${deleting.merchant}` : ""}, {deleting.date}. This cannot be undone.
          </p>
        )}
      </ConfirmDialog>
    </>
  );
}
