import { describe, expect, it } from "vitest";
import { formatMonthLabel, shiftMonth } from "@/lib/month";

describe("shiftMonth", () => {
  it("moves forward and back within a year", () => {
    expect(shiftMonth("2026-05", 1)).toBe("2026-06");
    expect(shiftMonth("2026-05", -1)).toBe("2026-04");
  });

  it("rolls over the year boundary in both directions", () => {
    expect(shiftMonth("2026-12", 1)).toBe("2027-01");
    expect(shiftMonth("2026-01", -1)).toBe("2025-12");
  });
});

describe("formatMonthLabel", () => {
  it("writes the month name and year", () => {
    expect(formatMonthLabel("2026-10")).toBe("October 2026");
    expect(formatMonthLabel("2026-01")).toBe("January 2026");
  });
});
