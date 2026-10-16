/** Chart colours come from the tokens in globals.css; donut slices and legend dots both use this. */
export const CHART_COLOR_COUNT = 7;

export function chartColor(index: number): string {
  const i = Math.max(0, index) % CHART_COLOR_COUNT;
  return `var(--color-chart-${i + 1})`;
}
