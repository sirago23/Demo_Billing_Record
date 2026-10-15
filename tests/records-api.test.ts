import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";

process.env.DATABASE_PATH = ":memory:";

const { getDb } = await import("@/lib/db/client");
const { records } = await import("@/lib/db/schema");
const { POST } = await import("@/app/api/records/route");

function postJson(body: unknown) {
  return POST(
    new Request("http://localhost/api/records", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: typeof body === "string" ? body : JSON.stringify(body),
    }),
  );
}

const valid = {
  type: "expense",
  amount: 125.5,
  date: "2026-10-15",
  category: "Food & Drink",
  merchant: "7-Eleven",
  note: "lunch",
};

beforeAll(() => {
  migrate(getDb(), { migrationsFolder: "drizzle" });
});

beforeEach(() => {
  getDb().delete(records).run();
});

describe("POST /api/records", () => {
  it("inserts a manual record with the amount stored in satang", async () => {
    const res = await postJson(valid);
    expect(res.status).toBe(201);

    const rows = getDb().select().from(records).all();
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      type: "expense",
      amountSatang: 12550,
      date: "2026-10-15",
      category: "Food & Drink",
      merchant: "7-Eleven",
      note: "lunch",
      source: "manual",
    });
  });

  it("stores source slip when the form was pre-filled from a slip", async () => {
    await postJson({ ...valid, source: "slip" });
    expect(getDb().select().from(records).all()[0].source).toBe("slip");
  });

  it("ignores an unknown source value and falls back to manual", async () => {
    await postJson({ ...valid, source: "hacked" });
    expect(getDb().select().from(records).all()[0].source).toBe("manual");
  });

  it("returns the saved record", async () => {
    const res = await postJson(valid);
    const body = await res.json();
    expect(body.record).toMatchObject({ id: expect.any(Number), amountSatang: 12550 });
  });

  it.each([
    ["amount 0", { ...valid, amount: 0 }],
    ["impossible date", { ...valid, date: "2026-02-30" }],
    ["3 decimals", { ...valid, amount: 1.234 }],
    ["category from the wrong type", { ...valid, type: "income" }],
    ["missing amount", { type: "expense", date: "2026-10-15", category: "Other" }],
  ])("rejects %s with 400 and writes nothing", async (_name, body) => {
    const res = await postJson(body);
    expect(res.status).toBe(400);
    expect(typeof (await res.json()).error).toBe("string");
    expect(getDb().select().from(records).all()).toHaveLength(0);
  });

  it("rejects a body that is not JSON with 400", async () => {
    const res = await postJson("not json");
    expect(res.status).toBe(400);
    expect(typeof (await res.json()).error).toBe("string");
  });
});
