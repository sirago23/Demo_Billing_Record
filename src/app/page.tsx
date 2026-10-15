"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { LogoutButton } from "@/components/LogoutButton";
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
    <main className="mx-auto max-w-4xl p-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Billing record</h1>
        <div className="flex items-center gap-4">
          <MonthPicker value={month} onChange={setMonth} />
          <Link href="/records" className="text-sm underline">
            Records
          </Link>
          <Link href="/records/new" className="rounded bg-slate-900 px-3 py-1.5 text-sm text-white">
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

      {summary ? (
        <div className="space-y-6">
          <SummaryCards summary={summary} />
          <div className="grid gap-6 md:grid-cols-2">
            <PieCard title="Expenses by category" data={summary.expenseByCategory} allCategories={EXPENSE_CATEGORIES} />
            <PieCard title="Income by category" data={summary.incomeByCategory} allCategories={INCOME_CATEGORIES} />
          </div>
        </div>
      ) : (
        !error && <p className="text-slate-600">Loading...</p>
      )}
    </main>
  );
}
