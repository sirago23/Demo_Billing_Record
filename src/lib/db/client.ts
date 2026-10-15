import Database from "better-sqlite3";
import { drizzle, type BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import * as schema from "./schema";

export const DEFAULT_DATABASE_PATH = "./data/billing.db";

let db: BetterSQLite3Database<typeof schema> | undefined;

export function getDb(): BetterSQLite3Database<typeof schema> {
  if (!db) {
    const path = process.env.DATABASE_PATH || DEFAULT_DATABASE_PATH;
    mkdirSync(dirname(path), { recursive: true });
    db = drizzle(new Database(path), { schema });
  }
  return db;
}
