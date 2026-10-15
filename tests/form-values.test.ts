import { describe, expect, it } from "vitest";
import { isLowConfidence, toFormValues } from "@/lib/form-values";

const data = {
  type: "expense" as const,
  amount: 2050.12,
  date: "2026-10-15",
  category: "Bills & Utilities",
  merchant_or_counterparty: "Allianz",
  note: "home insurance",
  confidence: 0.9,
};

describe("toFormValues", () => {
  it("maps extracted data to form field strings", () => {
    expect(toFormValues(data)).toEqual({
      type: "expense",
      amount: "2050.12",
      date: "2026-10-15",
      category: "Bills & Utilities",
      merchant: "Allianz",
      note: "home insurance",
    });
  });

  it("uses empty strings for missing merchant and note", () => {
    const values = toFormValues({ ...data, merchant_or_counterparty: undefined, note: undefined });
    expect(values.merchant).toBe("");
    expect(values.note).toBe("");
  });
});

describe("isLowConfidence", () => {
  it("is true below 0.7 and false at 0.7 or above", () => {
    expect(isLowConfidence(0.69)).toBe(true);
    expect(isLowConfidence(0.7)).toBe(false);
  });
});
