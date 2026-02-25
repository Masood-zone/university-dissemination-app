"use client";

import Link from "next/link";
import * as React from "react";

import { MaterialSymbol } from "@/components/common/MaterialSymbol";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { getApiErrorLabel } from "@/lib/api-client-error";
import { timeAgo } from "@/lib/utils";
import { useLecturerCourses } from "@/services/lecturer/courses/courses";
import {
  useCreateLecturerAnnouncement,
  useLecturerAnnouncements,
} from "@/services/lecturer/announcements/announcements";

export default function LecturerAnnouncementsPage() {
  const listQuery = useLecturerAnnouncements();
  const createMutation = useCreateLecturerAnnouncement();
  const coursesQuery = useLecturerCourses();

  const [title, setTitle] = React.useState("");
  const [content, setContent] = React.useState("");
  const [targetOfferingId, setTargetOfferingId] = React.useState<string>("");
  const [localError, setLocalError] = React.useState<string | null>(null);

  const errorLabel = listQuery.error ? getApiErrorLabel(listQuery.error) : null;

  const rows = listQuery.data?.rows ?? [];
  const courseOptions = coursesQuery.data?.rows ?? [];

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    if (!title.trim()) {
      setLocalError("Title is required");
      return;
    }

    if (!content.trim()) {
      setLocalError("Content is required");
      return;
    }

    try {
      await createMutation.mutateAsync({
        title: title.trim(),
        content: content.trim(),
        courseOfferingId: targetOfferingId ? targetOfferingId : null,
      });
      setTitle("");
      setContent("");
      setTargetOfferingId("");
    } catch (error) {
      const label = getApiErrorLabel(error);
      setLocalError(
        label.code ? `${label.message} (${label.code})` : label.message,
      );
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Lecturer Portal
          </p>
          <h1 className="font-lexend text-2xl font-semibold tracking-tight">
            Announcements
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Inform students about class updates, rescheduling, and more.
          </p>
        </div>

        <Button asChild variant="ghost">
          <Link href="/lecturer">Back to overview</Link>
        </Button>
      </header>

      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold">Post an announcement</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Publish an update to a specific course or all your courses.
            </p>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-muted/40">
            <MaterialSymbol
              icon="campaign"
              className="text-[20px] text-muted-foreground"
            />
          </div>
        </div>

        <form onSubmit={submit} className="mt-5 space-y-4">
          {localError ? (
            <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              {localError}
            </div>
          ) : null}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="md:col-span-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Title
              </label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-2 h-10 w-full rounded-xl border border-input bg-background px-3 text-sm"
                placeholder="e.g., Class rescheduled"
              />
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Target course
              </label>
              <div className="mt-2">
                {coursesQuery.isPending ? (
                  <Skeleton className="h-10 w-full rounded-xl" />
                ) : (
                  <Select
                    value={targetOfferingId}
                    onChange={(e) => setTargetOfferingId(e.target.value)}
                  >
                    <option value="">All my courses</option>
                    {courseOptions.map((c) => (
                      <option key={c.offeringId} value={c.offeringId}>
                        {c.courseCode} — {c.courseTitle}
                      </option>
                    ))}
                  </Select>
                )}
              </div>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Content
            </label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write the announcement..."
              className="mt-2 min-h-32"
            />
          </div>

          <div className="flex items-center justify-end gap-2">
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? "Publishing..." : "Publish"}
            </Button>
          </div>
        </form>
      </div>

      {errorLabel ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4">
          <p className="text-sm font-semibold">Failed to load announcements</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {errorLabel.code
              ? `${errorLabel.message} (${errorLabel.code})`
              : errorLabel.message}
          </p>
        </div>
      ) : null}

      <div className="rounded-2xl border border-border bg-card p-6">
        <p className="text-sm font-semibold">Announcement feed</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Announcements relevant to your assigned courses.
        </p>

        <div className="mt-5">
          {listQuery.isPending ? (
            <div className="space-y-3">
              <Skeleton className="h-16 w-full rounded-xl" />
              <Skeleton className="h-16 w-full rounded-xl" />
              <Skeleton className="h-16 w-full rounded-xl" />
            </div>
          ) : rows.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border p-6 text-sm text-muted-foreground">
              No announcements found.
            </div>
          ) : (
            <ul className="space-y-3">
              {rows.map((a) => (
                <li
                  key={a.id}
                  className="rounded-xl border border-border bg-background p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate">
                        {a.title}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground truncate">
                        {a.courseCode ? `${a.courseCode} • ` : ""}
                        {a.excerpt || "Announcement"}
                      </p>
                    </div>
                    <p className="text-[11px] text-muted-foreground whitespace-nowrap">
                      {timeAgo(a.publishedAt ?? a.createdAt)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
