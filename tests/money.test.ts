import { describe, expect, it } from "vitest";
import { bahtToSatang, formatBaht, satangToBaht } from "@/lib/money";

describe("bahtToSatang", () => {
  it("converts whole and fractional baht", () => {
    expect(bahtToSatang(125.5)).toBe(12550);
    expect(bahtToSatang(100)).toBe(10000);
  });

  it("avoids floating point drift", () => {
    expect(bahtToSatang(19.99)).toBe(1999);
    expect(bahtToSatang(0.1 + 0.2)).toBe(30);
  });
});

describe("satangToBaht", () => {
  it("converts back to baht", () => {
    expect(satangToBaht(12550)).toBe(125.5);
  });
});

describe("formatBaht", () => {
  it("formats with symbol, thousands separator and 2 decimals", () => {
    expect(formatBaht(123450)).toBe("฿1,234.50");
    expect(formatBaht(0)).toBe("฿0.00");
  });

  it("puts the minus sign before the symbol for negative balances", () => {
    expect(formatBaht(-5000)).toBe("-฿50.00");
  });
});
