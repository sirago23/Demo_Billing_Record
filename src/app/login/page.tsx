"use client";

import { useState, type FormEvent } from "react";
import { CircleAlert } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { APP_NAME } from "@/lib/app-name";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        window.location.assign("/");
        return;
      }
      const body: { error?: string } = await res.json().catch(() => ({}));
      setError(body.error ?? "Could not log in");
    } catch {
      setError("Could not log in");
    }
    setBusy(false);
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-4 py-8">
      <h1 className="mb-1 text-3xl font-semibold tracking-tight text-accent">{APP_NAME}</h1>
      <p className="mb-6 text-muted">Log in to see your income and expenses.</p>
      <form
        onSubmit={onSubmit}
        className="space-y-4 rounded-panel border border-rule bg-sheet p-6"
      >
        <Field
          label="Password"
          type="password"
          autoComplete="current-password"
          autoFocus
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error && (
          <p
            role="alert"
            className="flex items-start gap-2 rounded-control bg-err-bg px-3 py-2 text-sm text-out"
          >
            <CircleAlert aria-hidden className="mt-0.5 size-4 shrink-0" />
            {error}
          </p>
        )}
        <Button type="submit" disabled={busy} className="w-full">
          {busy ? "Logging in…" : "Log in"}
        </Button>
      </form>
    </main>
  );
}
