"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { chartColor } from "@/lib/chart-colors";
import { formatBaht } from "@/lib/money";
import { percentLabel, type CategoryTotal } from "@/lib/summary";

type Props = {
  title: string;
  subtitle: string;
  data: CategoryTotal[];
  /** Every category the type can have, so a category keeps its color when the month changes. */
  allCategories: readonly string[];
};

export function PieCard({ title, subtitle, data, allCategories }: Props) {
  const total = data.reduce((sum, d) => sum + d.amountSatang, 0);
  const colorOf = (category: string) => chartColor(Math.max(0, allCategories.indexOf(category)));

  return (
    <section className="min-w-0 rounded-panel border border-rule bg-sheet p-4 sm:p-5" aria-label={title}>
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="mb-4 text-sm text-muted">{subtitle}</p>
      {data.length === 0 ? (
        <p className="py-10 text-center text-muted">No data for this month</p>
      ) : (
        <div className="flex flex-col items-center gap-6">
          <div className="donut-fade relative size-44 shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  dataKey="amountSatang"
                  nameKey="category"
                  innerRadius="68%"
                  outerRadius="100%"
                  stroke="none"
                  startAngle={90}
                  endAngle={-270}
                  isAnimationActive={false}
                >
                  {data.map((d) => (
                    <Cell key={d.category} style={{ fill: colorOf(d.category) }} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatBaht(Number(value))} />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 grid place-content-center text-center">
              <span className="text-base font-semibold">{formatBaht(total)}</span>
              <span className="text-[0.8125rem] text-muted">total</span>
            </div>
          </div>
          <ul className="w-full space-y-2 text-[0.9375rem]">
            {data.map((d) => (
              <li key={d.category} className="flex items-baseline gap-2">
                <span
                  aria-hidden
                  className="size-2.5 shrink-0 self-center rounded-full"
                  style={{ backgroundColor: colorOf(d.category) }}
                />
                <span className="min-w-0">{d.category}</span>
                <span aria-hidden className="min-w-4 flex-1 -translate-y-0.5 border-b border-dotted border-rule" />
                <span className="font-medium">{formatBaht(d.amountSatang)}</span>
                <span className="w-14 shrink-0 text-right text-muted">{percentLabel(d.amountSatang, total)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
