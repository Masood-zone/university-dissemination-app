"use client";

import { type FormEvent, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { MaterialSymbol } from "@/components/common/MaterialSymbol";
import { cn } from "@/lib/utils";
import ImageUpload from "@/components/image-upload";
import { useGetEnrollmentDepartments } from "@/services/enrollment/enrollment";
import type { UpsertAnnouncementInput } from "@/types";

import { AnnouncementMarkdownEditor } from "./AnnouncementMarkdown";

const CATEGORY_OPTIONS = [
  "OLD_AFFAIRS",
  "CURRENT_AFFAIRS",
  "DEPARTMENTAL",
  "ACADEMIC",
  "EVENT",
  "MAINTENANCE",
  "OTHER",
] as const;

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function isoToDatetimeLocal(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";

  const y = d.getFullYear();
  const m = pad2(d.getMonth() + 1);
  const day = pad2(d.getDate());
  const hh = pad2(d.getHours());
  const mm = pad2(d.getMinutes());
  return `${y}-${m}-${day}T${hh}:${mm}`;
}

function datetimeLocalToIso(value: string): string {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) throw new Error("Invalid date time");
  return d.toISOString();
}

export type AnnouncementUpsertDraft = {
  title: string;
  content: string;
  excerpt: string;
  category: (typeof CATEGORY_OPTIONS)[number];
  priority: number;
  pinned: boolean;
  departmentId: string;
  imageUrl: string;
  mode: UpsertAnnouncementInput["mode"];
  publishedAt: string;
  expiresAt: string;
};

const DEFAULT_DRAFT: AnnouncementUpsertDraft = {
  title: "",
  content: "",
  excerpt: "",
  category: "OTHER",
  priority: 0,
  pinned: false,
  departmentId: "",
  imageUrl: "",
  mode: "DRAFT",
  publishedAt: "",
  expiresAt: "",
};

export function AnnouncementUpsertForm({
  initial,
  submitLabel,
  busy,
  onSubmit,
}: {
  initial?: Partial<AnnouncementUpsertDraft>;
  submitLabel: string;
  busy?: boolean;
  onSubmit: (payload: UpsertAnnouncementInput) => Promise<void> | void;
}) {
  const departmentsQuery = useGetEnrollmentDepartments();

  const mergedInitial = useMemo(
    () => ({ ...DEFAULT_DRAFT, ...initial }),
    [initial],
  );

  const [draft, setDraft] = useState<AnnouncementUpsertDraft>(
    () => mergedInitial,
  );

  const [localError, setLocalError] = useState<string | null>(null);

  const canSchedule = draft.mode === "SCHEDULE";

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLocalError(null);

    if (!draft.title.trim()) {
      setLocalError("Title is required");
      return;
    }

    if (!draft.content.trim()) {
      setLocalError("Content is required");
      return;
    }

    if (canSchedule && !draft.publishedAt) {
      setLocalError(
        "Published date/time is required for scheduled announcements",
      );
      return;
    }

    const payload: UpsertAnnouncementInput = {
      title: draft.title.trim(),
      content: draft.content,
      excerpt: draft.excerpt.trim() ? draft.excerpt.trim() : null,
      category: draft.category as UpsertAnnouncementInput["category"],
      priority: Number.isFinite(draft.priority) ? draft.priority : 0,
      pinned: draft.pinned,
      departmentId: draft.departmentId ? draft.departmentId : null,
      imageUrl: draft.imageUrl ? draft.imageUrl : null,
      mode: draft.mode,
      publishedAt: draft.publishedAt
        ? datetimeLocalToIso(draft.publishedAt)
        : null,
      expiresAt: draft.expiresAt ? datetimeLocalToIso(draft.expiresAt) : null,
    };

    await onSubmit(payload);
  };

  return (
    <form onSubmit={submit} className="space-y-6">
      {localError ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          {localError}
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Title
          </label>
          <input
            value={draft.title}
            onChange={(e) => setDraft((p) => ({ ...p, title: e.target.value }))}
            className="mt-2 h-10 w-full rounded-xl border border-input bg-background px-3 text-sm"
            placeholder="Announcement title"
          />
        </div>

        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Category
          </label>
          <select
            value={draft.category}
            onChange={(e) =>
              setDraft((p) => ({
                ...p,
                category: e.target.value as AnnouncementUpsertDraft["category"],
              }))
            }
            className="mt-2 h-10 w-full rounded-xl border border-input bg-background px-3 text-sm"
          >
            {CATEGORY_OPTIONS.map((c) => (
              <option key={c} value={c}>
                {c.replaceAll("_", " ")}
              </option>
            ))}
          </select>
        </div>

        <div className="lg:col-span-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Excerpt (optional)
          </label>
          <textarea
            value={draft.excerpt}
            onChange={(e) =>
              setDraft((p) => ({ ...p, excerpt: e.target.value }))
            }
            className="mt-2 min-h-24 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
            placeholder="Short summary shown in lists"
          />
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Department (optional)
            </label>
            <select
              value={draft.departmentId}
              onChange={(e) =>
                setDraft((p) => ({ ...p, departmentId: e.target.value }))
              }
              className="mt-2 h-10 w-full rounded-xl border border-input bg-background px-3 text-sm"
            >
              <option value="">All / Global</option>
              {(departmentsQuery.data ?? []).map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-border bg-card px-3 py-2">
            <div>
              <p className="text-sm font-semibold">Pinned</p>
              <p className="text-xs text-muted-foreground">
                Keep it at the top
              </p>
            </div>
            <input
              type="checkbox"
              checked={draft.pinned}
              onChange={(e) =>
                setDraft((p) => ({ ...p, pinned: e.target.checked }))
              }
              className="h-4 w-4 rounded border-input"
            />
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Priority (0-3)
            </label>
            <input
              type="number"
              min={0}
              max={3}
              value={draft.priority}
              onChange={(e) =>
                setDraft((p) => ({
                  ...p,
                  priority: Math.max(
                    0,
                    Math.min(3, Number(e.target.value || 0)),
                  ),
                }))
              }
              className="mt-2 h-10 w-full rounded-xl border border-input bg-background px-3 text-sm"
            />
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-4">
        <div className="grid gap-4 md:grid-cols-3 md:items-end">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Mode
            </label>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {(["DRAFT", "PUBLISH_NOW", "SCHEDULE"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  className={cn(
                    "h-10 rounded-xl px-3 text-[11px] font-semibold uppercase tracking-wider",
                    draft.mode === m
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-secondary-foreground hover:bg-accent",
                  )}
                  onClick={() => setDraft((p) => ({ ...p, mode: m }))}
                >
                  {m === "DRAFT"
                    ? "Draft"
                    : m === "PUBLISH_NOW"
                      ? "Publish"
                      : "Schedule"}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Publish date/time
            </label>
            <input
              type="datetime-local"
              value={draft.publishedAt}
              onChange={(e) =>
                setDraft((p) => ({ ...p, publishedAt: e.target.value }))
              }
              disabled={!canSchedule}
              className="mt-2 h-10 w-full rounded-xl border border-input bg-background px-3 text-sm disabled:opacity-60"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Only required for scheduling
            </p>
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Expires at (optional)
            </label>
            <input
              type="datetime-local"
              value={draft.expiresAt}
              onChange={(e) =>
                setDraft((p) => ({ ...p, expiresAt: e.target.value }))
              }
              className="mt-2 h-10 w-full rounded-xl border border-input bg-background px-3 text-sm"
            />
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Image (optional)
            </label>
            <div className="mt-2">
              <ImageUpload
                folder="announcements"
                value={draft.imageUrl ? draft.imageUrl : null}
                onChange={(url) =>
                  setDraft((p) => ({
                    ...p,
                    imageUrl: url || "",
                  }))
                }
              />
            </div>
          </div>
        </div>
      </div>

      <div>
        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Content
        </label>
        <div className="mt-2 overflow-hidden rounded-2xl border border-border bg-card p-3">
          <AnnouncementMarkdownEditor
            value={draft.content}
            onChange={(next) => setDraft((p) => ({ ...p, content: next }))}
          />
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={busy}>
          <MaterialSymbol icon="send" className="text-[18px]" />
          {busy ? "Saving..." : submitLabel}
        </Button>
      </div>
    </form>
  );
}

export function adminDetailToFormInitial(detail: {
  title: string;
  content: string;
  excerpt: string | null;
  category: string;
  priority: number;
  pinned: boolean;
  imageUrl: string | null;
  department: { id: string } | null;
  publishedAt: string | null;
  expiresAt: string | null;
  status: string;
}): Partial<AnnouncementUpsertDraft> {
  const inferredMode: UpsertAnnouncementInput["mode"] =
    detail.status === "DRAFT"
      ? "DRAFT"
      : detail.publishedAt &&
          new Date(detail.publishedAt).getTime() > Date.now()
        ? "SCHEDULE"
        : "PUBLISH_NOW";

  return {
    title: detail.title,
    content: detail.content,
    excerpt: detail.excerpt ?? "",
    category:
      (detail.category as AnnouncementUpsertDraft["category"]) || "OTHER",
    priority: detail.priority,
    pinned: detail.pinned,
    departmentId: detail.department?.id ?? "",
    imageUrl: detail.imageUrl ?? "",
    mode: inferredMode,
    publishedAt: isoToDatetimeLocal(detail.publishedAt),
    expiresAt: isoToDatetimeLocal(detail.expiresAt),
  };
}
