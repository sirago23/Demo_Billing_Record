import { describe, expect, it } from "vitest";
import { percentOf, sumByCategory, summarize, type SummaryRow } from "@/lib/summary";

const rows: SummaryRow[] = [
  { type: "income", category: "Salary", amountSatang: 3_000_000 },
  { type: "income", category: "Sales", amountSatang: 50_000 },
  { type: "expense", category: "Food & Drink", amountSatang: 12_550 },
  { type: "expense", category: "Food & Drink", amountSatang: 7_450 },
  { type: "expense", category: "Transport", amountSatang: 5_000 },
];

describe("summarize", () => {
  it("totals income, expense and balance in satang", () => {
    expect(summarize(rows)).toMatchObject({
      incomeSatang: 3_050_000,
      expenseSatang: 25_000,
      balanceSatang: 3_025_000,
    });
  });

  it("gives a negative balance when expenses exceed income", () => {
    const result = summarize([{ type: "expense", category: "Other", amountSatang: 100 }]);
    expect(result.balanceSatang).toBe(-100);
  });

  it("returns zeros and empty lists for an empty month", () => {
    expect(summarize([])).toEqual({
      incomeSatang: 0,
      expenseSatang: 0,
      balanceSatang: 0,
      expenseByCategory: [],
      incomeByCategory: [],
    });
  });

  it("includes per-category sums for both types", () => {
    const result = summarize(rows);
    expect(result.expenseByCategory).toEqual([
      { category: "Food & Drink", amountSatang: 20_000 },
      { category: "Transport", amountSatang: 5_000 },
    ]);
    expect(result.incomeByCategory).toEqual([
      { category: "Salary", amountSatang: 3_000_000 },
      { category: "Sales", amountSatang: 50_000 },
    ]);
  });
});

describe("sumByCategory", () => {
  it("ignores rows of the other type", () => {
    expect(sumByCategory(rows, "income").map((c) => c.category)).toEqual(["Salary", "Sales"]);
  });

  it("sorts the largest category first", () => {
    const sorted = sumByCategory(
      [
        { type: "expense", category: "Other", amountSatang: 1 },
        { type: "expense", category: "Shopping", amountSatang: 9 },
      ],
      "expense",
    );
    expect(sorted.map((c) => c.category)).toEqual(["Shopping", "Other"]);
  });
});

describe("percentOf", () => {
  it("returns the share as a whole percent", () => {
    expect(percentOf(20_000, 25_000)).toBe(80);
  });

  it("returns 0 when the total is 0", () => {
    expect(percentOf(0, 0)).toBe(0);
  });
});
