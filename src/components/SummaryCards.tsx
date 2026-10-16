import { formatBaht } from "@/lib/money";
import { percentOf, type Summary } from "@/lib/summary";

const STATEMENT = "text-[clamp(2.5rem,6.4vw,4.5rem)] leading-[1.02] font-semibold tracking-tight";
const STATEMENT_SUB = "mt-3.5 block text-base font-normal tracking-normal text-muted tab:text-xl";

function Statement({ summary }: { summary: Summary }) {
  const { balanceSatang, incomeSatang } = summary;
  if (balanceSatang < 0) {
    return (
      <p className={`${STATEMENT} text-out`}>
        {formatBaht(-balanceSatang)}
        <small className={STATEMENT_SUB}>more went out than came in this month.</small>
      </p>
    );
  }
  return (
    <p className={STATEMENT}>
      {formatBaht(balanceSatang)}
      <small className={STATEMENT_SUB}>
        left after spending this month.
        {incomeSatang > 0 && <> You kept {percentOf(balanceSatang, incomeSatang)}% of what came in.</>}
      </small>
    </p>
  );
}

export function SummaryCards({ summary }: { summary: Summary }) {
  const cells = [
    { label: "Total income", name: "Money in", value: summary.incomeSatang, cell: "", tone: "text-in" },
    { label: "Total expense", name: "Money out", value: summary.expenseSatang, cell: "", tone: "text-out" },
    { label: "Balance", name: "Balance", value: summary.balanceSatang, cell: "bg-accent-soft", tone: "" },
  ];
  return (
    <div className="space-y-8">
      <Statement summary={summary} />
      <dl className="grid overflow-hidden rounded-panel border border-rule bg-sheet tab:grid-cols-3">
        {cells.map((c) => (
          <div
            key={c.label}
            className={`flex items-baseline justify-between border-t border-rule px-[18px] py-3.5 first:border-t-0 tab:block tab:border-t-0 tab:border-l tab:px-6 tab:py-5 tab:first:border-l-0 ${c.cell}`}
          >
            <dt className={`text-sm ${c.label === "Balance" ? "text-accent" : "text-muted"}`}>
              <span className="sr-only">{c.label}</span>
              <span aria-hidden>{c.name}</span>
            </dt>
            <dd className={`text-xl font-semibold tab:mt-1.5 tab:text-[1.625rem] ${c.tone}`} data-testid={c.label}>
              {formatBaht(c.value)}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
