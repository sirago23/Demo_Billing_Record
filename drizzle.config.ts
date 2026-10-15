import { defineConfig } from "drizzle-kit";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";

const url = process.env.DATABASE_PATH || "./data/billing.db";
mkdirSync(dirname(url), { recursive: true });

export default defineConfig({
  dialect: "sqlite",
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
  dbCredentials: { url },
});
