"use client";

export function currentMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

type Props = { value: string; onChange: (month: string) => void };

export function MonthPicker({ value, onChange }: Props) {
  return (
    <label className="text-sm font-medium">
      Month{" "}
      <input
        type="month"
        value={value}
        onChange={(e) => e.target.value && onChange(e.target.value)}
        className="ml-1 rounded border border-slate-300 bg-white px-2 py-1"
      />
    </label>
  );
}
