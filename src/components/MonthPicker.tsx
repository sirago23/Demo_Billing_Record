"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { formatMonthLabel, shiftMonth } from "@/lib/month";

export function currentMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

type Props = { value: string; onChange: (month: string) => void };

const ARROW =
  "grid size-11 place-items-center rounded-control border border-rule bg-sheet text-ink hover:bg-paper";

export function MonthPicker({ value, onChange }: Props) {
  return (
    <div role="group" aria-label="Month" className="flex items-center gap-1.5">
      <button type="button" aria-label="Previous month" className={ARROW} onClick={() => onChange(shiftMonth(value, -1))}>
        <ChevronLeft aria-hidden size={20} />
      </button>
      <span aria-live="polite" className="min-w-36 text-center text-lg font-medium">
        {formatMonthLabel(value)}
      </span>
      <button type="button" aria-label="Next month" className={ARROW} onClick={() => onChange(shiftMonth(value, 1))}>
        <ChevronRight aria-hidden size={20} />
      </button>
    </div>
  );
}
