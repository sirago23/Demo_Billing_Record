"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { formatBaht } from "@/lib/money";
import { percentOf, type CategoryTotal } from "@/lib/summary";

// Categorical palette in fixed order (validated set from the dataviz skill, light surface).
const SERIES_COLORS = ["#2a78d6", "#eb6834", "#1baf7a", "#eda100", "#e87ba4", "#008300", "#6250d6", "#e34948"];

type Props = {
  title: string;
  data: CategoryTotal[];
  /** Every category the type can have, so a category keeps its color when the month changes. */
  allCategories: readonly string[];
};

export function PieCard({ title, data, allCategories }: Props) {
  const total = data.reduce((sum, d) => sum + d.amountSatang, 0);
  const colorOf = (category: string) =>
    SERIES_COLORS[Math.max(0, allCategories.indexOf(category)) % SERIES_COLORS.length];

  return (
    <section className="rounded border border-slate-200 bg-white p-4" aria-label={title}>
      <h2 className="mb-3 font-medium">{title}</h2>
      {data.length === 0 ? (
        <p className="py-12 text-center text-slate-600">No data for this month</p>
      ) : (
        <>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  dataKey="amountSatang"
                  nameKey="category"
                  innerRadius={50}
                  outerRadius={90}
                  stroke="#ffffff"
                  strokeWidth={2}
                  isAnimationActive={false}
                >
                  {data.map((d) => (
                    <Cell key={d.category} fill={colorOf(d.category)} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatBaht(Number(value))} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <ul className="mt-2 space-y-1 text-sm">
            {data.map((d) => (
              <li key={d.category} className="flex items-center gap-2">
                <span
                  aria-hidden
                  className="inline-block h-3 w-3 shrink-0 rounded-sm"
                  style={{ backgroundColor: colorOf(d.category) }}
                />
                <span className="flex-1">{d.category}</span>
                <span>{formatBaht(d.amountSatang)}</span>
                <span className="w-12 text-right text-slate-600">{percentOf(d.amountSatang, total)}%</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
