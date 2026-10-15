export function bahtToSatang(baht: number): number {
  return Math.round(baht * 100);
}

export function satangToBaht(satang: number): number {
  return satang / 100;
}

export function formatBaht(satang: number): string {
  const abs = Math.abs(satang) / 100;
  const text = abs.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return `${satang < 0 ? "-" : ""}฿${text}`;
}
