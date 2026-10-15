import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { getDb } from "../src/lib/db/client";
import { records } from "../src/lib/db/schema";
import { insertRecord } from "../src/lib/records";
import { buildSeedRecords } from "../src/lib/seed-data";

const reset = process.argv.includes("--reset");
const db = getDb();
migrate(db, { migrationsFolder: "./drizzle" });

const existing = db.select().from(records).all().length;
if (existing > 0 && !reset) {
  console.error(`The database already has ${existing} record(s). Run "npm run db:seed -- --reset" to replace them.`);
  process.exit(1);
}
if (reset) db.delete(records).run();

const rows = buildSeedRecords(new Date());
for (const row of rows) insertRecord(row, "manual");
console.log(`Seeded ${rows.length} records${reset ? " (existing records removed)" : ""}.`);
