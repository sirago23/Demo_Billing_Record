import { formatBaht } from "@/lib/money";
import type { Summary } from "@/lib/summary";

export function SummaryCards({ summary }: { summary: Summary }) {
  const cards = [
    { label: "Total income", value: summary.incomeSatang },
    { label: "Total expense", value: summary.expenseSatang },
    { label: "Balance", value: summary.balanceSatang },
  ];
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {cards.map((c) => (
        <div key={c.label} className="rounded border border-slate-200 bg-white p-4">
          <p className="text-sm text-slate-600">{c.label}</p>
          <p className="mt-1 text-2xl font-semibold" data-testid={c.label}>
            {formatBaht(c.value)}
          </p>
        </div>
      ))}
    </div>
  );
}
