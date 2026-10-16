"use client";

import { Inbox } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { MonthPicker, currentMonth } from "@/components/MonthPicker";
import { PieCard } from "@/components/PieCard";
import { SummaryCards } from "@/components/SummaryCards";
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from "@/lib/categories";
import { summarize, type SummaryRow } from "@/lib/summary";

export default function DashboardPage() {
  const [month, setMonth] = useState(currentMonth);
  const [rows, setRows] = useState<SummaryRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setRows(null);
    fetch(`/api/records?month=${month}`)
      .then(async (res) => {
        const body: { records?: SummaryRow[]; error?: string } = await res.json();
        if (!res.ok || !body.records) throw new Error(body.error ?? "Could not load records");
        if (!cancelled) {
          setRows(body.records);
          setError(null);
        }
      })
      .catch((e: unknown) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Could not load records");
      });
    return () => {
      cancelled = true;
    };
  }, [month]);

  const summary = useMemo(() => (rows ? summarize(rows) : null), [rows]);

  return (
    <>
      <AppHeader />
      <main className="mx-auto max-w-4xl px-4 pt-6 pb-24 sm:px-8 tab:pb-8">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-lg font-semibold text-muted">Overview</h1>
          <MonthPicker value={month} onChange={setMonth} />
        </div>

        {error && (
          <p role="alert" className="mt-4 rounded-control bg-err-bg px-3 py-2 text-sm text-out">
            {error}
          </p>
        )}

        {summary && rows && rows.length === 0 ? (
          <section className="mt-8 rounded-panel border border-dashed border-rule bg-sheet px-6 py-14 text-center">
            <Inbox aria-hidden className="mx-auto text-muted" size={32} />
            <p className="mt-3 text-lg font-semibold">No data for this month</p>
            <p className="mt-1 text-muted">Use Add record to put in your first income or expense.</p>
          </section>
        ) : summary ? (
          <div className="mt-6 space-y-8">
            <SummaryCards summary={summary} />
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <PieCard
                title="Expenses by category"
                subtitle="Where the money went"
                data={summary.expenseByCategory}
                allCategories={EXPENSE_CATEGORIES}
              />
              <PieCard
                title="Income by category"
                subtitle="Where it came from"
                data={summary.incomeByCategory}
                allCategories={INCOME_CATEGORIES}
              />
            </div>
          </div>
        ) : (
          !error && <p className="mt-8 text-muted">Loading...</p>
        )}
      </main>
    </>
  );
}
