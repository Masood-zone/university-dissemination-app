"use client";

import { useEffect, useRef } from "react";

import { MaterialSymbol } from "@/components/common/MaterialSymbol";
import { cn } from "@/lib/utils";

export default function RejectApplicationModal({
  open,
  submitting,
  initialReason = "",
  error,
  onClose,
  onSubmit,
}: {
  open: boolean;
  submitting: boolean;
  initialReason?: string;
  error?: string | null;
  onClose: () => void;
  onSubmit: (reason: string) => void;
}) {
  const reasonRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <button
        type="button"
        className="absolute inset-0 bg-background/60 backdrop-blur-sm"
        aria-label="Close reject modal"
        onClick={onClose}
      />

      <div className="relative w-full max-w-lg rounded-2xl border border-border bg-card p-5 shadow-lg">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold">Reject application</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Provide a brief reason that will be sent to the applicant.
            </p>
          </div>
          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-background hover:bg-accent"
            aria-label="Close"
            onClick={onClose}
            disabled={submitting}
          >
            <MaterialSymbol icon="close" className="text-lg" />
          </button>
        </div>

        <div className="mt-4">
          <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Reason
          </label>
          <textarea
            key={`${open ? "open" : "closed"}-${initialReason}`}
            ref={reasonRef}
            defaultValue={initialReason}
            rows={4}
            className={cn(
              "mt-2 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            )}
            placeholder="E.g. Missing required documents, inconsistent personal details..."
            disabled={submitting}
          />

          {error ? (
            <p className="mt-2 text-sm text-destructive">{error}</p>
          ) : null}
        </div>

        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            className="inline-flex h-10 items-center justify-center rounded-xl border border-border bg-background px-4 text-sm font-medium hover:bg-accent"
            onClick={onClose}
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            type="button"
            className="inline-flex h-10 items-center justify-center rounded-xl bg-destructive px-4 text-sm font-semibold text-destructive-foreground hover:opacity-90 disabled:opacity-60"
            onClick={() => onSubmit(reasonRef.current?.value ?? "")}
            disabled={submitting}
          >
            {submitting ? "Rejecting..." : "Reject"}
          </button>
        </div>
      </div>
    </div>
  );
}
