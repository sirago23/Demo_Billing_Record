import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const records = sqliteTable("records", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  type: text("type", { enum: ["income", "expense"] }).notNull(),
  amountSatang: integer("amount_satang").notNull(), // THB x 100, avoids float errors
  date: text("date").notNull(), // YYYY-MM-DD
  category: text("category").notNull(),
  merchant: text("merchant"),
  note: text("note"),
  source: text("source", { enum: ["manual", "slip"] }).notNull(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export type RecordRow = typeof records.$inferSelect;
export type NewRecordRow = typeof records.$inferInsert;
