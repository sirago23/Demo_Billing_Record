"use client";

import { useState } from "react";
import { toFormValues, isLowConfidence } from "@/lib/form-values";
import type { ClaudeOutput } from "@/lib/validation";
import { RecordForm, type RecordFormValues } from "./RecordForm";

type Extracted = { values: RecordFormValues; lowConfidence: boolean };

export function UploadBox() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [extracted, setExtracted] = useState<Extracted | null>(null);
  const [formKey, setFormKey] = useState(0);

  async function onFile(event: React.ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const file = input.files?.[0];
    if (!file) return;
    setLoading(true);
    setError(null);
    setMessage(null);
    setExtracted(null);
    try {
      const body = new FormData();
      body.set("image", file);
      const res = await fetch("/api/extract", { method: "POST", body });
      const json: { ok?: boolean; data?: ClaudeOutput; message?: string; error?: string } = await res
        .json()
        .catch(() => ({}));
      if (!res.ok) {
        setError(json.error ?? "Could not upload the image");
      } else if (json.ok && json.data) {
        setExtracted({ values: toFormValues(json.data), lowConfidence: isLowConfidence(json.data.confidence) });
        setFormKey((k) => k + 1);
      } else {
        setMessage(json.message ?? "Could not read this image, please fill in manually");
        setFormKey((k) => k + 1);
      }
    } catch {
      setError("Could not reach the server");
    } finally {
      setLoading(false);
      input.value = "";
    }
  }

  return (
    <div className="space-y-4">
      <label className="block rounded-lg border-2 border-dashed border-slate-300 bg-white p-4 text-sm font-medium">
        Upload a slip or receipt (JPEG, PNG or WebP, up to 10 MB)
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={onFile}
          disabled={loading}
          className="mt-3 block w-full cursor-pointer text-sm text-slate-600 file:mr-4 file:cursor-pointer file:rounded file:border-0 file:bg-slate-900 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-slate-700 disabled:opacity-50"
        />
      </label>

      {loading && (
        <p role="status" className="text-sm text-slate-600">
          Reading the image, this takes a few seconds...
        </p>
      )}
      {error && (
        <p role="alert" className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
      {message && (
        <p role="alert" className="rounded bg-amber-50 px-3 py-2 text-sm text-amber-800">
          {message}
        </p>
      )}
      {extracted?.lowConfidence && (
        <p role="alert" className="rounded bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Please check these values
        </p>
      )}

      <RecordForm
        key={formKey}
        initial={extracted?.values}
        source={extracted ? "slip" : "manual"}
        onSaved={() => {
          setExtracted(null);
          setMessage(null);
        }}
      />
    </div>
  );
}
