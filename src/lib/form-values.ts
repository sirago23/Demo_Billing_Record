import type { RecordFormValues } from "@/components/RecordForm";
import type { ClaudeOutput } from "./validation";

export const LOW_CONFIDENCE_THRESHOLD = 0.7;

export function isLowConfidence(confidence: number): boolean {
  return confidence < LOW_CONFIDENCE_THRESHOLD;
}

export function toFormValues(data: ClaudeOutput): RecordFormValues {
  return {
    type: data.type,
    amount: String(data.amount),
    date: data.date,
    category: data.category,
    merchant: data.merchant_or_counterparty ?? "",
    note: data.note ?? "",
  };
}
