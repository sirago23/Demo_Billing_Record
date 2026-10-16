import { describe, expect, it } from "vitest";
import { CHART_COLOR_COUNT, chartColor } from "@/lib/chart-colors";

describe("chartColor", () => {
  it("maps index 0 to the first chart token", () => {
    expect(chartColor(0)).toBe("var(--color-chart-1)");
  });

  it("wraps around after the last token", () => {
    expect(chartColor(CHART_COLOR_COUNT)).toBe(chartColor(0));
  });

  it("treats a negative index as the first colour", () => {
    expect(chartColor(-1)).toBe(chartColor(0));
  });
});
