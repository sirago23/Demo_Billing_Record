import { z } from "zod";
import { isCategoryForType, RECORD_TYPES } from "./categories";

const MAX_AMOUNT = 1_000_000_000;
const BUDDHIST_ERA_OFFSET = 543;

function isRealDate(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;
  const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
  const d = new Date(Date.UTC(year, month - 1, day));
  return d.getUTCFullYear() === year && d.getUTCMonth() === month - 1 && d.getUTCDate() === day;
}

const dateSchema = z.string().refine(isRealDate, "Invalid date, use YYYY-MM-DD");

const amountSchema = z
  .number()
  .finite()
  .positive("Amount must be greater than 0")
  .max(MAX_AMOUNT, "Amount is too large")
  .refine((n) => Math.abs(n * 100 - Math.round(n * 100)) < 1e-6, "At most 2 decimals");

const typeSchema = z.enum(RECORD_TYPES);

function checkCategory(
  value: { type: (typeof RECORD_TYPES)[number]; category: string },
  ctx: z.RefinementCtx,
) {
  if (!isCategoryForType(value.type, value.category)) {
    ctx.addIssue({ code: "custom", path: ["category"], message: "Category does not match the type" });
  }
}

export const recordInputSchema = z
  .object({
    type: typeSchema,
    amount: amountSchema,
    date: dateSchema,
    category: z.string(),
    merchant: z.string().trim().max(200).optional(),
    note: z.string().trim().max(500).optional(),
  })
  .superRefine(checkCategory);

export type RecordInput = z.infer<typeof recordInputSchema>;

/** Thai slips often show Buddhist-era years (2569 = 2026). Convert to CE before validating. */
function convertBuddhistYear(value: unknown): unknown {
  if (typeof value !== "string") return value;
  const match = /^(\d{4})(-\d{2}-\d{2})$/.exec(value);
  if (!match) return value;
  const year = Number(match[1]);
  return year >= 2400 ? `${year - BUDDHIST_ERA_OFFSET}${match[2]}` : value;
}

export const claudeOutputSchema = z
  .object({
    type: typeSchema,
    amount: amountSchema,
    date: z.preprocess(convertBuddhistYear, dateSchema),
    category: z.string(),
    merchant_or_counterparty: z.string().trim().max(200).optional(),
    note: z.string().trim().max(500).optional(),
    confidence: z.number().min(0).max(1),
  })
  .superRefine(checkCategory);

export type ClaudeOutput = z.infer<typeof claudeOutputSchema>;

export type ParseResult = { ok: true; data: ClaudeOutput } | { ok: false };

/** Takes the model's raw text, strips anything around the JSON object and validates it. */
export function parseClaudeOutput(text: string): ParseResult {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end <= start) return { ok: false };
  let json: unknown;
  try {
    json = JSON.parse(text.slice(start, end + 1));
  } catch {
    return { ok: false };
  }
  const result = claudeOutputSchema.safeParse(json);
  return result.success ? { ok: true, data: result.data } : { ok: false };
}
