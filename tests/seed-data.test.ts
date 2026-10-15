import { describe, expect, it } from "vitest";
import { buildSeedRecords } from "@/lib/seed-data";
import { recordInputSchema } from "@/lib/validation";

const months = (rows: { date: string }[]) => [...new Set(rows.map((r) => r.date.slice(0, 7)))].sort();

describe("buildSeedRecords", () => {
  it("covers the current and previous month, with income and several expense categories", () => {
    const rows = buildSeedRecords(new Date(2026, 9, 15));
    expect(months(rows)).toEqual(["2026-09", "2026-10"]);
    for (const month of ["2026-09", "2026-10"]) {
      const inMonth = rows.filter((r) => r.date.startsWith(month));
      expect(inMonth.some((r) => r.type === "income")).toBe(true);
      expect(new Set(inMonth.filter((r) => r.type === "expense").map((r) => r.category)).size).toBeGreaterThanOrEqual(4);
    }
  });

  it("only produces records that pass the record input schema", () => {
    for (const row of buildSeedRecords(new Date(2026, 9, 15))) {
      expect(recordInputSchema.safeParse(row).success).toBe(true);
    }
  });

  it("never dates a record after today", () => {
    const rows = buildSeedRecords(new Date(2026, 9, 3));
    expect(rows.every((r) => r.date <= "2026-10-03")).toBe(true);
    expect(rows.some((r) => r.date.startsWith("2026-10"))).toBe(true);
  });

  it("rolls over the year boundary and short months", () => {
    expect(months(buildSeedRecords(new Date(2027, 0, 31)))).toEqual(["2026-12", "2027-01"]);
    const march = buildSeedRecords(new Date(2027, 2, 31));
    expect(months(march)).toEqual(["2027-02", "2027-03"]);
    expect(march.every((r) => recordInputSchema.safeParse(r).success)).toBe(true);
  });
});
