import { describe, expect, it } from "vitest";
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, isCategoryForType } from "@/lib/categories";

describe("categories", () => {
  it("has the preset expense list from the spec", () => {
    expect(EXPENSE_CATEGORIES).toEqual([
      "Food & Drink",
      "Transport",
      "Shopping",
      "Bills & Utilities",
      "Health",
      "Entertainment",
      "Other",
    ]);
  });

  it("has the preset income list from the spec", () => {
    expect(INCOME_CATEGORIES).toEqual(["Salary", "Transfer In", "Sales", "Other"]);
  });

  it("accepts a category only for its own type", () => {
    expect(isCategoryForType("expense", "Transport")).toBe(true);
    expect(isCategoryForType("income", "Transport")).toBe(false);
    expect(isCategoryForType("income", "Salary")).toBe(true);
    expect(isCategoryForType("expense", "Other")).toBe(true);
  });
});
