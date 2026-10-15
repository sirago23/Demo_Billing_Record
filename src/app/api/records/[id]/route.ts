import { NextResponse } from "next/server";
import { deleteRecord, updateRecord } from "@/lib/records";
import { recordInputSchema } from "@/lib/validation";

type Context = { params: Promise<{ id: string }> };

function fail(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

function parseId(raw: string): number | null {
  return /^\d+$/.test(raw) ? Number(raw) : null;
}

export async function PATCH(request: Request, { params }: Context) {
  const id = parseId((await params).id);
  if (id === null) return fail("Record not found", 404);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return fail("Request body must be JSON", 400);
  }
  const parsed = recordInputSchema.safeParse(body);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid record", 400);

  const record = updateRecord(id, parsed.data);
  return record ? NextResponse.json({ record }) : fail("Record not found", 404);
}

export async function DELETE(_request: Request, { params }: Context) {
  const id = parseId((await params).id);
  if (id === null || !deleteRecord(id)) return fail("Record not found", 404);
  return NextResponse.json({ ok: true });
}
