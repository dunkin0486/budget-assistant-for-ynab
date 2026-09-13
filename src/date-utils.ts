/** Returns the last n months as "YYYY-MM-01" strings, oldest first, ending
 * with the current month. */
export function lastNMonths(n: number): string[] {
  const months: string[] = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    months.push(d.toISOString().slice(0, 8) + "01");
  }
  return months;
}
