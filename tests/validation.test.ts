import { describe, expect, it } from "vitest";
import { parseClaudeOutput, recordInputSchema } from "@/lib/validation";

const validRecord = {
  type: "expense",
  amount: 125.5,
  date: "2026-10-15",
  category: "Food & Drink",
  merchant: "7-Eleven",
  note: "lunch",
};

describe("recordInputSchema", () => {
  it("accepts a valid record", () => {
    expect(recordInputSchema.safeParse(validRecord).success).toBe(true);
  });

  it("accepts a record without merchant and note", () => {
    const minimal = { type: "expense", amount: 10, date: "2026-10-15", category: "Other" };
    expect(recordInputSchema.safeParse(minimal).success).toBe(true);
  });

  it("rejects amount 0", () => {
    expect(recordInputSchema.safeParse({ ...validRecord, amount: 0 }).success).toBe(false);
  });

  it("rejects a negative amount", () => {
    expect(recordInputSchema.safeParse({ ...validRecord, amount: -5 }).success).toBe(false);
  });

  it("rejects more than 2 decimals", () => {
    expect(recordInputSchema.safeParse({ ...validRecord, amount: 10.123 }).success).toBe(false);
  });

  it("rejects an impossible date", () => {
    expect(recordInputSchema.safeParse({ ...validRecord, date: "2026-02-30" }).success).toBe(false);
  });

  it("rejects a badly formatted date", () => {
    expect(recordInputSchema.safeParse({ ...validRecord, date: "15/10/2026" }).success).toBe(false);
  });

  it("rejects a category that does not match the type", () => {
    const result = recordInputSchema.safeParse({ ...validRecord, type: "income" });
    expect(result.success).toBe(false);
  });

  it("rejects an unknown type", () => {
    expect(recordInputSchema.safeParse({ ...validRecord, type: "refund" }).success).toBe(false);
  });
});

const validClaude = {
  type: "expense",
  amount: 350,
  date: "2026-10-14",
  category: "Transport",
  merchant_or_counterparty: "Grab",
  note: "ride home",
  confidence: 0.92,
};

describe("parseClaudeOutput", () => {
  it("parses plain JSON", () => {
    const result = parseClaudeOutput(JSON.stringify(validClaude));
    expect(result).toEqual({ ok: true, data: validClaude });
  });

  it("parses JSON wrapped in extra text and code fences", () => {
    const text = "Here is the result:\n```json\n" + JSON.stringify(validClaude) + "\n```\nHope this helps.";
    const result = parseClaudeOutput(text);
    expect(result.ok).toBe(true);
  });

  it("converts a Buddhist-era year to CE", () => {
    const result = parseClaudeOutput(JSON.stringify({ ...validClaude, date: "2569-10-14" }));
    expect(result.ok && result.data.date).toBe("2026-10-14");
  });

  it("leaves a CE year unchanged", () => {
    const result = parseClaudeOutput(JSON.stringify(validClaude));
    expect(result.ok && result.data.date).toBe("2026-10-14");
  });

  it("accepts missing optional fields", () => {
    const minimal = { type: "expense", amount: 10, date: "2026-10-15", category: "Other", confidence: 0.5 };
    expect(parseClaudeOutput(JSON.stringify(minimal)).ok).toBe(true);
  });

  it("rejects an unknown category", () => {
    const result = parseClaudeOutput(JSON.stringify({ ...validClaude, category: "Groceries" }));
    expect(result.ok).toBe(false);
  });

  it("rejects a category from the wrong type", () => {
    const result = parseClaudeOutput(JSON.stringify({ ...validClaude, type: "income" }));
    expect(result.ok).toBe(false);
  });

  it("rejects amount 0 and confidence above 1", () => {
    expect(parseClaudeOutput(JSON.stringify({ ...validClaude, amount: 0 })).ok).toBe(false);
    expect(parseClaudeOutput(JSON.stringify({ ...validClaude, confidence: 1.5 })).ok).toBe(false);
  });

  it("rejects text with no JSON", () => {
    expect(parseClaudeOutput("I cannot read this image.").ok).toBe(false);
  });

  it("rejects broken JSON", () => {
    expect(parseClaudeOutput('{"type": "expense", ').ok).toBe(false);
  });
});
