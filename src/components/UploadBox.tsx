"use client";

import { ImageOff, Sparkles, TriangleAlert, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toFormValues, isLowConfidence } from "@/lib/form-values";
import { checkImageFile } from "@/lib/image-file";
import type { ClaudeOutput } from "@/lib/validation";
import { RecordForm, type RecordFormValues } from "./RecordForm";

type Extracted = { values: RecordFormValues; lowConfidence: boolean };

export function UploadBox() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [extracted, setExtracted] = useState<Extracted | null>(null);
  const [formKey, setFormKey] = useState(0);

  async function onFile(event: React.ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const file = input.files?.[0];
    if (!file) return;
    setError(null);
    setMessage(null);
    const problem = checkImageFile(file);
    if (problem) {
      setError(problem);
      input.value = "";
      return;
    }
    setLoading(true);
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

  const failure = error ?? message;

  return (
    <div className="grid items-start gap-4 tab:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] tab:gap-7">
      <label
        className={`flex min-h-[200px] flex-col items-center justify-center gap-2.5 rounded-panel border-[1.5px] border-dashed border-muted/50 bg-sheet p-8 text-center tab:min-h-[300px] has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-accent ${
          loading ? "cursor-wait" : "cursor-pointer hover:border-accent"
        }`}
      >
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          aria-label="Choose file"
          onChange={onFile}
          disabled={loading}
          className="sr-only"
        />
        {loading ? (
          <>
            <span aria-hidden className="size-11 animate-spin rounded-full border-[3px] border-accent-soft border-t-accent motion-reduce:animate-none" />
            <p role="status" className="text-lg font-semibold">
              Reading the image, this takes a few seconds...
            </p>
          </>
        ) : (
          <>
            <span
              aria-hidden
              className={`grid size-14 place-items-center rounded-full ${failure ? "bg-err-bg text-out" : "bg-accent-soft text-accent"}`}
            >
              {failure ? <ImageOff size={26} /> : <Upload size={26} />}
            </span>
            {failure ? (
              <p role="alert" className="max-w-64 text-lg font-semibold text-out">
                {failure}
              </p>
            ) : (
              <>
                <h2 className="text-lg font-semibold">Upload a slip or receipt</h2>
                <p className="max-w-64 text-sm text-muted">
                  JPEG, PNG or WebP, up to 10 MB. Or fill in the form by hand.
                </p>
              </>
            )}
            <span className="mt-1 inline-flex min-h-11 items-center rounded-control border border-rule bg-sheet px-4 font-medium">
              {failure ? "Try another file" : "Choose file"}
            </span>
          </>
        )}
      </label>

      <section className="rounded-panel border border-rule bg-sheet p-5 sm:p-7" aria-label="Record details">
        {extracted?.lowConfidence && (
          <p role="alert" className="mb-5 flex items-start gap-2.5 rounded-control bg-warn-bg px-3.5 py-3 text-warn">
            <TriangleAlert aria-hidden size={18} className="mt-1 shrink-0" />
            Please check these values
          </p>
        )}
        {extracted && !extracted.lowConfidence && (
          <p className="mb-4 flex items-center gap-2 text-sm text-muted">
            <Sparkles aria-hidden size={16} className="text-accent" />
            Filled in from your image. Check it, then save.
          </p>
        )}
        <RecordForm
          key={formKey}
          initial={extracted?.values}
          source={extracted ? "slip" : "manual"}
          onCancel={() => router.push("/")}
          onSaved={() => {
            setExtracted(null);
            setMessage(null);
          }}
        />
      </section>
    </div>
  );
}
