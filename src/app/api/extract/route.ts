import { NextResponse } from "next/server";
import { createExtractClient } from "@/lib/claude-client";
import { extractFromImage } from "@/lib/extract";

const MAX_BYTES = 10 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

function fail(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(request: Request) {
  let file: FormDataEntryValue | null;
  try {
    file = (await request.formData()).get("image");
  } catch {
    return fail("Upload an image file", 400);
  }
  if (!(file instanceof Blob)) return fail("Upload an image file", 400);
  if (!ALLOWED_TYPES.includes(file.type)) return fail("Only JPEG, PNG or WebP images are accepted", 400);
  if (file.size > MAX_BYTES) return fail("Image is larger than 10 MB", 413);

  const result = await extractFromImage(Buffer.from(await file.arrayBuffer()), createExtractClient());
  return NextResponse.json(result);
}
