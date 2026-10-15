import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";

process.env.DATABASE_PATH = ":memory:";

const { getDb } = await import("@/lib/db/client");
const { records } = await import("@/lib/db/schema");
const { insertRecord } = await import("@/lib/records");
const { GET } = await import("@/app/api/records/route");
const { PATCH, DELETE } = await import("@/app/api/records/[id]/route");

function get(query: string) {
  return GET(new Request(`http://localhost/api/records${query}`));
}
function ctx(id: string) {
  return { params: Promise.resolve({ id }) };
}
function patch(id: string, body: unknown) {
  return PATCH(
    new Request(`http://localhost/api/records/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    }),
    ctx(id),
  );
}
function del(id: string) {
  return DELETE(new Request(`http://localhost/api/records/${id}`, { method: "DELETE" }), ctx(id));
}

const base = { type: "expense" as const, amount: 100, category: "Food & Drink" };

beforeAll(() => {
  migrate(getDb(), { migrationsFolder: "drizzle" });
});

beforeEach(() => {
  getDb().delete(records).run();
});

describe("GET /api/records?month=", () => {
  it("returns only the chosen month, newest first", async () => {
    insertRecord({ ...base, date: "2026-10-03", amount: 10 }, "manual");
    insertRecord({ ...base, date: "2026-10-20", amount: 20 }, "manual");
    insertRecord({ ...base, date: "2026-09-30", amount: 30 }, "manual");
    insertRecord({ ...base, date: "2026-11-01", amount: 40 }, "manual");

    const res = await get("?month=2026-10");
    expect(res.status).toBe(200);
    const { records: rows } = await res.json();
    expect(rows.map((r: { date: string }) => r.date)).toEqual(["2026-10-20", "2026-10-03"]);
    expect(rows[0].amountSatang).toBe(2000);
  });

  it("orders records on the same date by newest id first", async () => {
    const a = insertRecord({ ...base, date: "2026-10-05" }, "manual");
    const b = insertRecord({ ...base, date: "2026-10-05" }, "manual");
    const { records: rows } = await (await get("?month=2026-10")).json();
    expect(rows.map((r: { id: number }) => r.id)).toEqual([b.id, a.id]);
  });

  it("returns an empty list for a month without records", async () => {
    const { records: rows } = await (await get("?month=2025-01")).json();
    expect(rows).toEqual([]);
  });

  it.each(["", "?month=2026-13", "?month=2026-1", "?month=abcd-ef", "?month=2026-10-01"])(
    "rejects invalid month %s with 400",
    async (query) => {
      const res = await get(query);
      expect(res.status).toBe(400);
      expect(typeof (await res.json()).error).toBe("string");
    },
  );
});

describe("PATCH /api/records/[id]", () => {
  it("updates the fields and keeps the source", async () => {
    const row = insertRecord({ ...base, date: "2026-10-05", merchant: "Old" }, "slip");
    const res = await patch(String(row.id), {
      type: "income",
      amount: 1234.5,
      date: "2026-10-06",
      category: "Salary",
      merchant: "ACME",
      note: "",
    });
    expect(res.status).toBe(200);
    const saved = getDb().select().from(records).all()[0];
    expect(saved).toMatchObject({
      type: "income",
      amountSatang: 123450,
      date: "2026-10-06",
      category: "Salary",
      merchant: "ACME",
      note: null,
      source: "slip",
    });
  });

  it("rejects invalid input with 400 and leaves the row unchanged", async () => {
    const row = insertRecord({ ...base, date: "2026-10-05" }, "manual");
    const res = await patch(String(row.id), { ...base, date: "2026-10-05", amount: 0 });
    expect(res.status).toBe(400);
    expect(getDb().select().from(records).all()[0].amountSatang).toBe(10000);
  });

  it("returns 404 for an unknown id", async () => {
    const res = await patch("999", { ...base, date: "2026-10-05" });
    expect(res.status).toBe(404);
  });

  it("returns 404 for a non-numeric id", async () => {
    const res = await patch("abc", { ...base, date: "2026-10-05" });
    expect(res.status).toBe(404);
  });
});

describe("DELETE /api/records/[id]", () => {
  it("removes the row", async () => {
    const row = insertRecord({ ...base, date: "2026-10-05" }, "manual");
    const res = await del(String(row.id));
    expect(res.status).toBe(200);
    expect(getDb().select().from(records).all()).toHaveLength(0);
  });

  it("returns 404 for an unknown id", async () => {
    expect((await del("999")).status).toBe(404);
  });
});
