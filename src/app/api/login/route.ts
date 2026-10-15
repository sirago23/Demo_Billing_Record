import { NextResponse } from "next/server";
import { SESSION_COOKIE, SESSION_MAX_AGE_SECONDS, passwordMatches, signSession } from "@/lib/auth";

export async function POST(request: Request) {
  const { APP_PASSWORD, SESSION_SECRET } = process.env;
  if (!APP_PASSWORD || !SESSION_SECRET || SESSION_SECRET.length < 32) {
    return NextResponse.json({ error: "Login is not configured on the server" }, { status: 500 });
  }

  let password: unknown;
  try {
    ({ password } = await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  if (typeof password !== "string") {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  if (!(await passwordMatches(password, APP_PASSWORD))) {
    return NextResponse.json({ error: "Wrong password" }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, await signSession(SESSION_SECRET, Date.now()), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
  return res;
}
