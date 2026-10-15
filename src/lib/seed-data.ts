import type { RecordInput } from "./validation";

type Template = Omit<RecordInput, "date"> & { day: number };

// One month of demo data; the same template is used for the previous and the current month.
const TEMPLATES: Template[] = [
  { type: "income", amount: 30000, category: "Salary", merchant: "Employer Co.", day: 1 },
  { type: "income", amount: 500, category: "Sales", merchant: "Online shop", day: 9 },
  { type: "expense", amount: 85, category: "Food & Drink", merchant: "Cafe Amazon", day: 2 },
  { type: "expense", amount: 120.5, category: "Food & Drink", merchant: "Street food", day: 6 },
  { type: "expense", amount: 85, category: "Transport", merchant: "BTS", day: 3 },
  { type: "expense", amount: 1500, category: "Shopping", merchant: "Central", day: 8 },
  { type: "expense", amount: 2050.12, category: "Bills & Utilities", merchant: "Electricity", day: 5 },
  { type: "expense", amount: 450, category: "Health", merchant: "Pharmacy", day: 11 },
  { type: "expense", amount: 300, category: "Entertainment", merchant: "Cinema", day: 12 },
];

const pad = (n: number) => String(n).padStart(2, "0");

function monthRecords(year: number, monthIndex: number, lastDay: number): RecordInput[] {
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const maxDay = Math.min(lastDay, daysInMonth);
  return TEMPLATES.map(({ day, ...rest }) => ({
    ...rest,
    date: `${year}-${pad(monthIndex + 1)}-${pad(Math.min(day, maxDay))}`,
  }));
}

/** Demo records for the previous month and the current month, none dated after `today`. */
export function buildSeedRecords(today: Date): RecordInput[] {
  const year = today.getFullYear();
  const monthIndex = today.getMonth();
  const previous = new Date(year, monthIndex - 1, 1);
  return [
    ...monthRecords(previous.getFullYear(), previous.getMonth(), 31),
    ...monthRecords(year, monthIndex, today.getDate()),
  ];
}
