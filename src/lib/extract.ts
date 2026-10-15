import sharp from "sharp";
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from "./categories";
import { parseClaudeOutput, type ClaudeOutput } from "./validation";

export const UNREADABLE_MESSAGE = "Could not read this image, please fill in manually";
export const MAX_EDGE_PX = 1568;

export type ExtractClient = {
  /** Sends the image with the extraction prompt and returns the model's raw text. */
  readImage(args: { image: Buffer; mediaType: "image/jpeg"; prompt: string }): Promise<string>;
};

export type ExtractResult = { ok: true; data: ClaudeOutput } | { ok: false; message: string };

export const EXTRACT_PROMPT = `You read Thai bank transfer slips and Thai or English receipts.
Reply with ONE JSON object only, no other text, with these keys:
- "type": "expense" if the owner paid money out (a transfer to someone, a bill, a purchase), "income" if money came in.
- "amount": the total in THB as a number greater than 0, e.g. 1234.5 (no currency symbol, no thousands separator).
- "date": the transaction date as YYYY-MM-DD. Thai slips often use Buddhist-era years (2569 = 2026); keep the year exactly as printed.
- "category": for expense one of ${EXPENSE_CATEGORIES.join(", ")}; for income one of ${INCOME_CATEGORIES.join(", ")}.
- "merchant_or_counterparty": the shop or the other party's name, if visible.
- "note": the memo on the slip, if any.
- "confidence": a number from 0 to 1 for how sure you are about amount, date and type.
If this is not a slip or receipt, or you cannot read it, still reply with a JSON object and set "confidence" to 0.`;

const FAILED: ExtractResult = { ok: false, message: UNREADABLE_MESSAGE };

/** Resizes the image, asks Claude to read it and validates the answer. Never throws; never writes to the DB. */
export async function extractFromImage(image: Buffer, client: ExtractClient): Promise<ExtractResult> {
  try {
    const resized = await sharp(image)
      .rotate()
      .resize({ width: MAX_EDGE_PX, height: MAX_EDGE_PX, fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 85 })
      .toBuffer();
    const text = await client.readImage({ image: resized, mediaType: "image/jpeg", prompt: EXTRACT_PROMPT });
    const parsed = parseClaudeOutput(text);
    return parsed.ok ? { ok: true, data: parsed.data } : FAILED;
  } catch {
    return FAILED;
  }
}
