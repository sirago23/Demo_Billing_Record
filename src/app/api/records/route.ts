import { NextResponse } from "next/server";
import { insertRecord } from "@/lib/records";
import { recordInputSchema } from "@/lib/validation";

function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return badRequest("Request body must be JSON");
  }

  const parsed = recordInputSchema.safeParse(body);
  if (!parsed.success) {
    return badRequest(parsed.error.issues[0]?.message ?? "Invalid record");
  }

  const source = (body as { source?: unknown }).source === "slip" ? "slip" : "manual";
  const record = insertRecord(parsed.data, source);
  return NextResponse.json({ record }, { status: 201 });
}
