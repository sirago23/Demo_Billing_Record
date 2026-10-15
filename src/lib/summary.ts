import type { RecordType } from "./categories";

export type SummaryRow = { type: RecordType; category: string; amountSatang: number };
export type CategoryTotal = { category: string; amountSatang: number };

export type Summary = {
  incomeSatang: number;
  expenseSatang: number;
  balanceSatang: number;
  expenseByCategory: CategoryTotal[];
  incomeByCategory: CategoryTotal[];
};

/** Per-category totals for one type, largest first. */
export function sumByCategory(rows: SummaryRow[], type: RecordType): CategoryTotal[] {
  const totals = new Map<string, number>();
  for (const r of rows) {
    if (r.type !== type) continue;
    totals.set(r.category, (totals.get(r.category) ?? 0) + r.amountSatang);
  }
  return [...totals]
    .map(([category, amountSatang]) => ({ category, amountSatang }))
    .sort((a, b) => b.amountSatang - a.amountSatang);
}

function total(list: CategoryTotal[]): number {
  return list.reduce((sum, c) => sum + c.amountSatang, 0);
}

export function summarize(rows: SummaryRow[]): Summary {
  const incomeByCategory = sumByCategory(rows, "income");
  const expenseByCategory = sumByCategory(rows, "expense");
  const incomeSatang = total(incomeByCategory);
  const expenseSatang = total(expenseByCategory);
  return {
    incomeSatang,
    expenseSatang,
    balanceSatang: incomeSatang - expenseSatang,
    expenseByCategory,
    incomeByCategory,
  };
}

export function percentOf(part: number, whole: number): number {
  return whole === 0 ? 0 : Math.round((part / whole) * 100);
}
