import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import sharp from "sharp";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";

process.env.DATABASE_PATH = ":memory:";

// A plain function, not vi.fn: vitest 5 marks a test failed when a vi.fn mock throws, even if the code under test catches it.
const claude = { calls: 0, reply: async (): Promise<string> => "" };
vi.mock("@/lib/claude-client", () => ({
  createExtractClient: () => ({
    readImage: () => {
      claude.calls += 1;
      return claude.reply();
    },
  }),
}));

const { POST } = await import("@/app/api/extract/route");
const { getDb } = await import("@/lib/db/client");
const { records } = await import("@/lib/db/schema");

async function png() {
  return sharp({ create: { width: 50, height: 50, channels: 3, background: "#fff" } }).png().toBuffer();
}

function upload(file: Blob | null, name = "slip.png") {
  const form = new FormData();
  if (file) form.set("image", file, name);
  return POST(new Request("http://localhost/api/extract", { method: "POST", body: form }));
}

const answer = JSON.stringify({
  type: "expense",
  amount: 80,
  date: "2569-10-15",
  category: "Bills & Utilities",
  confidence: 0.9,
});

beforeAll(() => {
  migrate(getDb(), { migrationsFolder: "drizzle" });
});

beforeEach(() => {
  claude.calls = 0;
});

describe("POST /api/extract", () => {
  it("returns extracted data and writes nothing to the database", async () => {
    claude.reply = async () => answer;
    const res = await upload(new Blob([await png()], { type: "image/png" }));
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ ok: true, data: { amount: 80, date: "2026-10-15" } });
    const rows = getDb().select().from(records).all();
    expect(rows).toHaveLength(0);
  });

  it("returns ok:false with the manual-entry message when reading fails", async () => {
    claude.reply = async () => {
      throw new Error("boom");
    };
    const res = await upload(new Blob([await png()], { type: "image/png" }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      ok: false,
      message: "Could not read this image, please fill in manually",
    });
  });

  it("rejects a missing file with 400", async () => {
    const res = await upload(null);
    expect(res.status).toBe(400);
    expect(claude.calls).toBe(0);
  });

  it("rejects a wrong file type with 400 and does not call Claude", async () => {
    const res = await upload(new Blob(["%PDF-1.4"], { type: "application/pdf" }), "a.pdf");
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/JPEG, PNG or WebP/);
    expect(claude.calls).toBe(0);
  });

  it("rejects a file over 10 MB with 413", async () => {
    const big = new Blob([new Uint8Array(10 * 1024 * 1024 + 1)], { type: "image/png" });
    const res = await upload(big);
    expect(res.status).toBe(413);
    expect(claude.calls).toBe(0);
  });
});
