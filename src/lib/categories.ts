export const EXPENSE_CATEGORIES = [
  "Food & Drink",
  "Transport",
  "Shopping",
  "Bills & Utilities",
  "Health",
  "Entertainment",
  "Other",
] as const;

export const INCOME_CATEGORIES = ["Salary", "Transfer In", "Sales", "Other"] as const;

export const RECORD_TYPES = ["income", "expense"] as const;
export type RecordType = (typeof RECORD_TYPES)[number];

export function categoriesFor(type: RecordType): readonly string[] {
  return type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
}

export function isCategoryForType(type: RecordType, category: string): boolean {
  return categoriesFor(type).includes(category);
}
