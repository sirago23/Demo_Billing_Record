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
