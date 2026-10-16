"use client";

import { useEffect, useRef } from "react";
import { Button } from "./Button";

type Props = {
  open: boolean;
  title: string;
  children: React.ReactNode;
  confirmLabel: string;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

/** Native <dialog> opened with showModal(): the browser traps focus and Esc fires the cancel event. */
export function ConfirmDialog({ open, title, children, confirmLabel, busy = false, onConfirm, onCancel }: Props) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby="confirm-dialog-title"
      onCancel={(e) => {
        e.preventDefault();
        onCancel();
      }}
      onClick={(e) => {
        if (e.target === ref.current) onCancel();
      }}
      className="m-auto w-[min(92vw,26rem)] rounded-panel border border-rule bg-sheet p-0 text-ink backdrop:bg-ink/40"
    >
      {/* Padding lives on this inner div: a click on the dialog's own padding would hit the dialog itself and read as a backdrop click. */}
      <div className="p-6">
        <h2 id="confirm-dialog-title" className="text-lg font-semibold">
          {title}
        </h2>
        <div className="mt-2 text-muted">{children}</div>
        <div className="mt-6 flex gap-3 sm:justify-end">
          <Button type="button" variant="secondary" onClick={onCancel} autoFocus className="flex-1 sm:flex-none">
            Cancel
          </Button>
          <Button type="button" variant="danger" onClick={onConfirm} disabled={busy} className="flex-1 sm:flex-none">
            {busy ? "Deleting..." : confirmLabel}
          </Button>
        </div>
      </div>
    </dialog>
  );
}
