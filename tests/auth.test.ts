import { beforeEach, afterEach, describe, expect, it } from "vitest";
import { SESSION_MAX_AGE_SECONDS, passwordMatches, signSession, verifySession } from "@/lib/auth";

const SECRET = "test-secret-test-secret-test-secret-1234";
const NOW = 1_800_000_000_000;

describe("session cookie", () => {
  it("accepts a freshly signed token", async () => {
    const token = await signSession(SECRET, NOW);
    expect(await verifySession(token, SECRET, NOW + 1000)).toBe(true);
  });

  it("rejects a tampered expiry", async () => {
    const token = await signSession(SECRET, NOW);
    const [, sig] = token.split(".");
    const forged = `${NOW + 10 * 365 * 86400 * 1000}.${sig}`;
    expect(await verifySession(forged, SECRET, NOW + 1000)).toBe(false);
  });

  it("rejects a tampered signature", async () => {
    const token = await signSession(SECRET, NOW);
    const flipped = token.slice(0, -1) + (token.endsWith("0") ? "1" : "0");
    expect(await verifySession(flipped, SECRET, NOW + 1000)).toBe(false);
  });

  it("rejects a token signed with another secret", async () => {
    const token = await signSession("another-secret-another-secret-12345", NOW);
    expect(await verifySession(token, SECRET, NOW + 1000)).toBe(false);
  });

  it("rejects an expired token", async () => {
    const token = await signSession(SECRET, NOW);
    expect(await verifySession(token, SECRET, NOW + SESSION_MAX_AGE_SECONDS * 1000 + 1)).toBe(false);
  });

  it("rejects missing, empty and malformed tokens", async () => {
    expect(await verifySession(undefined, SECRET, NOW)).toBe(false);
    expect(await verifySession("", SECRET, NOW)).toBe(false);
    expect(await verifySession("garbage", SECRET, NOW)).toBe(false);
    expect(await verifySession("abc.def", SECRET, NOW)).toBe(false);
  });

  it("rejects everything when the secret is missing or too short", async () => {
    const token = await signSession(SECRET, NOW);
    expect(await verifySession(token, undefined, NOW)).toBe(false);
    expect(await verifySession(token, "short", NOW)).toBe(false);
    await expect(signSession(undefined, NOW)).rejects.toThrow();
  });
});

describe("passwordMatches", () => {
  it("matches only the exact password", async () => {
    expect(await passwordMatches("hunter2", "hunter2")).toBe(true);
    expect(await passwordMatches("hunter3", "hunter2")).toBe(false);
    expect(await passwordMatches("", "hunter2")).toBe(false);
  });
  it("never matches when no password is configured", async () => {
    expect(await passwordMatches("", undefined)).toBe(false);
    expect(await passwordMatches("", "")).toBe(false);
  });
});

describe("login and logout routes", () => {
  const saved = { p: process.env.APP_PASSWORD, s: process.env.SESSION_SECRET };
  beforeEach(() => {
    process.env.APP_PASSWORD = "correct horse";
    process.env.SESSION_SECRET = SECRET;
  });
  afterEach(() => {
    process.env.APP_PASSWORD = saved.p;
    process.env.SESSION_SECRET = saved.s;
  });

  function login(body: unknown) {
    return import("@/app/api/login/route").then(({ POST }) =>
      POST(
        new Request("http://localhost/api/login", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: typeof body === "string" ? body : JSON.stringify(body),
        }),
      ),
    );
  }

  it("sets an httpOnly 7-day cookie for the right password", async () => {
    const res = await login({ password: "correct horse" });
    expect(res.status).toBe(200);
    const cookie = res.headers.get("set-cookie") ?? "";
    expect(cookie).toMatch(/^session=/);
    expect(cookie).toMatch(/HttpOnly/i);
    expect(cookie).toMatch(/SameSite=lax/i);
    expect(cookie).toMatch(/Max-Age=604800/);
    const token = cookie.split(";")[0].slice("session=".length);
    expect(await verifySession(token, SECRET, Date.now())).toBe(true);
  });

  it("returns 401 'Wrong password' and no cookie for a wrong password", async () => {
    const res = await login({ password: "nope" });
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: "Wrong password" });
    expect(res.headers.get("set-cookie")).toBeNull();
  });

  it("returns 400 for a malformed body", async () => {
    expect((await login("not json")).status).toBe(400);
    expect((await login({ password: 5 })).status).toBe(400);
  });

  it("fails closed with 500 when env is not configured", async () => {
    delete process.env.APP_PASSWORD;
    const res = await login({ password: "" });
    expect(res.status).toBe(500);
    expect(res.headers.get("set-cookie")).toBeNull();
  });

  it("logout clears the cookie", async () => {
    const { POST } = await import("@/app/api/logout/route");
    const res = await POST();
    const cookie = res.headers.get("set-cookie") ?? "";
    expect(cookie).toMatch(/^session=;/);
    expect(cookie).toMatch(/Max-Age=0/);
  });
});
