import { and, desc, eq, gte, lt } from "drizzle-orm";
import { getDb } from "./db/client";
import { records, type RecordRow } from "./db/schema";
import { bahtToSatang } from "./money";
import type { RecordInput } from "./validation";

export type RecordSource = RecordRow["source"];

export function insertRecord(input: RecordInput, source: RecordSource): RecordRow {
  return getDb()
    .insert(records)
    .values({
      type: input.type,
      amountSatang: bahtToSatang(input.amount),
      date: input.date,
      category: input.category,
      merchant: input.merchant || null,
      note: input.note || null,
      source,
    })
    .returning()
    .get();
}

/** "YYYY-MM" with a month from 01 to 12. */
export function isValidMonth(value: string | null): value is string {
  return value !== null && /^\d{4}-(0[1-9]|1[0-2])$/.test(value);
}

function nextMonth(month: string): string {
  const [year, m] = month.split("-").map(Number);
  return m === 12 ? `${year + 1}-01` : `${year}-${String(m + 1).padStart(2, "0")}`;
}

/** Records dated in the given month, newest first. */
export function listRecordsByMonth(month: string): RecordRow[] {
  return getDb()
    .select()
    .from(records)
    .where(and(gte(records.date, `${month}-01`), lt(records.date, `${nextMonth(month)}-01`)))
    .orderBy(desc(records.date), desc(records.id))
    .all();
}

/** Returns the updated row, or undefined when the id does not exist. The source is left unchanged. */
export function updateRecord(id: number, input: RecordInput): RecordRow | undefined {
  return getDb()
    .update(records)
    .set({
      type: input.type,
      amountSatang: bahtToSatang(input.amount),
      date: input.date,
      category: input.category,
      merchant: input.merchant || null,
      note: input.note || null,
    })
    .where(eq(records.id, id))
    .returning()
    .get();
}

/** Returns true when a row was deleted. */
export function deleteRecord(id: number): boolean {
  return getDb().delete(records).where(eq(records.id, id)).returning().all().length > 0;
}
