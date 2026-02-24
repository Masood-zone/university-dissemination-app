"use client";

import * as React from "react";
import Link from "next/link";

import { MaterialSymbol } from "@/components/common/MaterialSymbol";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn, timeAgo } from "@/lib/utils";
import {
  useStudentAnnouncementsFeed,
  type StudentAnnouncementsFeedParams,
} from "@/services/announcements/announcements";
import type {
  StudentAnnouncementPriorityFilter,
  StudentAnnouncementsScope,
  StudentAnnouncementsSort,
} from "@/types";

function useDebouncedValue<T>(value: T, delayMs: number) {
  const [debounced, setDebounced] = React.useState(value);

  React.useEffect(() => {
    const t = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(t);
  }, [value, delayMs]);

  return debounced;
}

function PriorityPill({ priority }: { priority: number }) {
  const label = priority >= 3 ? "Critical" : priority >= 2 ? "High" : "Normal";
  const tone =
    priority >= 3
      ? "border-destructive/30 bg-destructive/10 text-destructive"
      : priority >= 2
        ? "border-primary/30 bg-primary/10 text-primary"
        : "border-border bg-muted/40 text-muted-foreground";

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold",
        tone,
      )}
    >
      {label}
    </span>
  );
}

function labelForCategory(value: string): string {
  switch (value) {
    case "OLD_AFFAIRS":
      return "Old Affairs";
    case "CURRENT_AFFAIRS":
      return "Current Affairs";
    case "DEPARTMENTAL":
      return "Departmental";
    case "ACADEMIC":
      return "Academic";
    case "EVENT":
      return "Events";
    case "MAINTENANCE":
      return "Administrative";
    default:
      return "Other";
  }
}

function iconForCategory(value: string): string {
  switch (value) {
    case "ACADEMIC":
      return "school";
    case "EVENT":
      return "event";
    case "CURRENT_AFFAIRS":
      return "newspaper";
    case "OLD_AFFAIRS":
      return "history";
    case "MAINTENANCE":
      return "admin_panel_settings";
    case "DEPARTMENTAL":
      return "apartment";
    default:
      return "campaign";
  }
}

export default function StudentAnnouncementsPage() {
  const [qDraft, setQDraft] = React.useState("");
  const q = useDebouncedValue(qDraft.trim(), 350);
  const [scope, setScope] = React.useState<StudentAnnouncementsScope>("ALL");
  const [category, setCategory] = React.useState<string>("");
  const [sort, setSort] = React.useState<StudentAnnouncementsSort>("RECENT");
  const [priority, setPriority] =
    React.useState<StudentAnnouncementPriorityFilter>("ALL");
  const [page, setPage] = React.useState(1);
  const pageSize = 10;

  React.useEffect(() => {
    setPage(1);
  }, [q, scope, category, sort, priority]);

  const params: StudentAnnouncementsFeedParams = {
    q: q || undefined,
    scope,
    category: category || undefined,
    sort,
    priority,
    page,
    pageSize,
  };

  const { data, isLoading, error, isFetching } = useStudentAnnouncementsFeed(
    params,
    true,
  );

  const totalPages = React.useMemo(() => {
    if (!data) return 1;
    return Math.max(1, Math.ceil(data.total / data.pageSize));
  }, [data]);

  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      <aside className="w-full shrink-0 lg:w-80">
        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="space-y-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Filter
              </p>
              <h2 className="mt-1 text-sm font-semibold">Feed</h2>
              <div className="mt-3 space-y-1">
                <Button
                  type="button"
                  variant={scope === "ALL" ? "secondary" : "ghost"}
                  className="w-full justify-between"
                  onClick={() => {
                    setScope("ALL");
                    setCategory("");
                  }}
                >
                  <span className="inline-flex items-center gap-2">
                    <MaterialSymbol icon="view_list" className="text-[18px]" />
                    All feed
                  </span>
                  {scope === "ALL" && data ? (
                    <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
                      {data.total}
                    </span>
                  ) : null}
                </Button>
                <Button
                  type="button"
                  variant={scope === "DEPARTMENTAL" ? "secondary" : "ghost"}
                  className="w-full justify-between"
                  onClick={() => {
                    setScope("DEPARTMENTAL");
                    setCategory("");
                  }}
                >
                  <span className="inline-flex items-center gap-2">
                    <MaterialSymbol icon="apartment" className="text-[18px]" />
                    Departmental
                  </span>
                </Button>
              </div>
            </div>

            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Filter by category
              </h3>
              <div className="mt-3 space-y-1">
                <Button
                  type="button"
                  variant={!category ? "secondary" : "ghost"}
                  className="w-full justify-between"
                  onClick={() => setCategory("")}
                >
                  <span className="inline-flex items-center gap-2">
                    <MaterialSymbol icon="campaign" className="text-[18px]" />
                    All categories
                  </span>
                </Button>
                {(data?.categories ?? []).map((c) => (
                  <Button
                    key={String(c.category)}
                    type="button"
                    variant={
                      category === String(c.category) ? "secondary" : "ghost"
                    }
                    className="w-full justify-between"
                    onClick={() => setCategory(String(c.category))}
                  >
                    <span className="inline-flex items-center gap-2 truncate">
                      <MaterialSymbol
                        icon={iconForCategory(String(c.category))}
                        className="text-[18px]"
                      />
                      <span className="truncate">{c.label}</span>
                    </span>
                    <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
                      {c.count}
                    </span>
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Priority level
              </h3>
              <div className="mt-3 space-y-2">
                <label className="flex cursor-pointer items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="priority"
                    checked={priority === "ALL"}
                    onChange={() => setPriority("ALL")}
                    className="h-4 w-4"
                  />
                  <span>All priorities</span>
                </label>
                <label className="flex cursor-pointer items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="priority"
                    checked={priority === "CRITICAL"}
                    onChange={() => setPriority("CRITICAL")}
                    className="h-4 w-4"
                  />
                  <span>Critical only</span>
                </label>
                <label className="flex cursor-pointer items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="priority"
                    checked={priority === "HIGH"}
                    onChange={() => setPriority("HIGH")}
                    className="h-4 w-4"
                  />
                  <span>High priority</span>
                </label>
                <label className="flex cursor-pointer items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="priority"
                    checked={priority === "NORMAL"}
                    onChange={() => setPriority("NORMAL")}
                    className="h-4 w-4"
                  />
                  <span>Normal priority</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      </aside>

      <div className="min-w-0 flex-1 space-y-6">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Student Portal
            </p>
            <h1 className="font-lexend text-2xl font-semibold tracking-tight">
              Notice Board
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Stay updated with university-wide and departmental notices.
            </p>
          </div>

          <div className="w-full max-w-md">
            <div className="relative">
              <MaterialSymbol
                icon="search"
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-muted-foreground"
              />
              <Input
                value={qDraft}
                onChange={(e) => setQDraft(e.target.value)}
                placeholder="Search announcements..."
                className="pl-9"
              />
            </div>
          </div>
        </header>

        <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="inline-flex items-center rounded-xl border border-border bg-background p-1">
            <Button
              type="button"
              variant={sort === "RECENT" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setSort("RECENT")}
            >
              Recent
            </Button>
            <Button
              type="button"
              variant={sort === "OLDEST" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setSort("OLDEST")}
            >
              Oldest
            </Button>
          </div>

          <div className="inline-flex items-center gap-2 text-xs text-muted-foreground">
            {isFetching ? (
              <>
                <span className="h-2 w-2 animate-pulse rounded-full bg-muted-foreground/60" />
                Updating…
              </>
            ) : data ? (
              <>
                <span className="font-semibold text-foreground">
                  {data.total}
                </span>
                results
              </>
            ) : null}
          </div>
        </div>

        <section className="space-y-3">
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="h-24 rounded-2xl border border-border bg-card animate-pulse"
                />
              ))}
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-border bg-card p-6">
              <p className="text-sm font-semibold">
                Failed to load announcements
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Please try again.
              </p>
            </div>
          ) : (data?.rows?.length ?? 0) === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
              <p className="text-sm font-semibold">No announcements</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Try clearing filters or searching a different keyword.
              </p>
            </div>
          ) : (
            <ul className="space-y-3">
              {(data?.rows ?? []).map((a) => (
                <li key={a.id}>
                  <Link
                    href={`/student/announcements/${a.id}`}
                    className={cn(
                      "block rounded-2xl border border-border bg-card p-5 transition-colors hover:bg-accent/30",
                      a.priority >= 3
                        ? "border-l-4 border-l-destructive"
                        : a.priority >= 2
                          ? "border-l-4 border-l-primary"
                          : "border-l-4 border-l-border",
                    )}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          {a.pinned ? (
                            <span className="inline-flex items-center rounded-full border border-border bg-muted/40 px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
                              Pinned
                            </span>
                          ) : null}
                          <PriorityPill priority={a.priority} />
                          <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/40 px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
                            <MaterialSymbol
                              icon={iconForCategory(String(a.category))}
                              className="text-[14px]"
                            />
                            {labelForCategory(String(a.category))}
                          </span>
                          {a.departmentName ? (
                            <span className="inline-flex items-center rounded-full border border-border bg-muted/40 px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
                              {a.departmentName}
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-full border border-border bg-muted/40 px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
                              Global
                            </span>
                          )}
                        </div>

                        <p className="mt-2 text-sm font-semibold truncate">
                          {a.title}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                          {a.excerpt || "No excerpt provided."}
                        </p>

                        <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
                          <span className="inline-flex items-center gap-1">
                            <MaterialSymbol
                              icon="person"
                              className="text-[14px]"
                            />
                            {a.authorName}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <MaterialSymbol
                              icon="visibility"
                              className="text-[14px]"
                            />
                            {a.viewCount}
                          </span>
                          <span className="ml-auto inline-flex items-center gap-1 font-semibold text-primary">
                            Read full notice
                            <MaterialSymbol
                              icon="arrow_right_alt"
                              className="text-[14px]"
                            />
                          </span>
                        </div>
                      </div>

                      <div className="text-right text-[11px] text-muted-foreground whitespace-nowrap">
                        {a.publishedAt
                          ? timeAgo(a.publishedAt)
                          : timeAgo(a.createdAt)}
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <div className="flex items-center justify-between rounded-2xl border border-border bg-card p-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
          >
            Previous
          </Button>
          <p className="text-xs text-muted-foreground">
            Page <span className="font-semibold text-foreground">{page}</span>{" "}
            of{" "}
            <span className="font-semibold text-foreground">{totalPages}</span>
          </p>
          <Button
            type="button"
            variant="outline"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
