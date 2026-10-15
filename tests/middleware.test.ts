import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { signSession } from "@/lib/auth";

const SECRET = "test-secret-test-secret-test-secret-1234";
process.env.SESSION_SECRET = SECRET;
const { middleware } = await import("@/middleware");

function req(path: string, token?: string) {
  return new NextRequest(`http://localhost${path}`, {
    headers: token ? { cookie: `session=${token}` } : {},
  });
}

describe("middleware", () => {
  it("redirects pages to /login without a cookie", async () => {
    const res = await middleware(req("/"));
    expect(res.status).toBe(307);
    expect(new URL(res.headers.get("location")!).pathname).toBe("/login");
  });

  it("returns 401 JSON for API routes without a cookie", async () => {
    for (const p of ["/api/records", "/api/extract", "/api/logout"]) {
      const res = await middleware(req(p));
      expect(res.status).toBe(401);
      expect(await res.json()).toEqual({ error: "Not logged in" });
    }
  });

  it("rejects a tampered cookie", async () => {
    const token = await signSession(SECRET, Date.now());
    const res = await middleware(req("/api/records", token.slice(0, -1) + "x"));
    expect(res.status).toBe(401);
  });

  it("lets a valid cookie through", async () => {
    const token = await signSession(SECRET, Date.now());
    const res = await middleware(req("/api/records", token));
    expect(res.status).toBe(200);
    expect(res.headers.get("x-middleware-next")).toBe("1");
  });

  it("leaves /login and /api/login open", async () => {
    for (const p of ["/login", "/api/login"]) {
      const res = await middleware(req(p));
      expect(res.headers.get("x-middleware-next")).toBe("1");
    }
  });
});
