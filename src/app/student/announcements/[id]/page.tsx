"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

import { MaterialSymbol } from "@/components/common/MaterialSymbol";
import { AnnouncementMarkdownPreview } from "@/components/admin/announcements/AnnouncementMarkdown";
import { Button } from "@/components/ui/button";
import { cn, timeAgo } from "@/lib/utils";
import { useStudentAnnouncementDetail } from "@/services/announcements/announcements";

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString();
}

function PriorityBadge({ priority }: { priority: number }) {
  const label =
    priority >= 3 ? "Critical" : priority >= 2 ? "High Priority" : "Normal";
  const tone =
    priority >= 3
      ? "border-destructive/30 bg-destructive/10 text-destructive"
      : priority >= 2
        ? "border-primary/30 bg-primary/10 text-primary"
        : "border-border bg-muted/40 text-muted-foreground";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-wider",
        tone,
      )}
    >
      {priority >= 2 ? (
        <MaterialSymbol icon="priority_high" className="text-[14px]" />
      ) : null}
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
      return String(value).replaceAll("_", " ");
  }
}

function CategoryBadge({ category }: { category: string }) {
  return (
    <span className="inline-flex items-center rounded-full border border-border bg-primary/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-primary">
      {labelForCategory(category)}
    </span>
  );
}

export default function StudentAnnouncementDetailPage() {
  const params = useParams<{ id?: string }>();
  const id = typeof params?.id === "string" ? params.id : "";
  const { data, isLoading, error } = useStudentAnnouncementDetail(
    id,
    Boolean(id),
  );

  const announcement = data?.announcement;

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between gap-4">
        <Button asChild variant="ghost" className="px-0">
          <Link
            href="/student/announcements"
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-primary"
          >
            <MaterialSymbol icon="arrow_back" className="text-[18px]" />
            Back to feed
          </Link>
        </Button>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="secondary"
            onClick={() => window.print()}
            disabled={!announcement}
          >
            <MaterialSymbol icon="print" className="text-[18px]" />
            Print
          </Button>
        </div>
      </header>

      {!id ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
          <p className="text-sm font-semibold">Announcement not found</p>
          <p className="mt-1 text-sm text-muted-foreground">
            It may have expired or you may not have access to it.
          </p>
        </div>
      ) : isLoading ? (
        <div className="space-y-4">
          <div className="h-10 w-2/3 rounded-xl bg-muted/40 animate-pulse" />
          <div className="h-6 w-1/2 rounded-xl bg-muted/40 animate-pulse" />
          <div className="h-80 rounded-3xl border border-border bg-card animate-pulse" />
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-border bg-card p-6">
          <p className="text-sm font-semibold">Failed to load announcement</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Please try again.
          </p>
        </div>
      ) : !announcement ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
          <p className="text-sm font-semibold">Announcement not found</p>
          <p className="mt-1 text-sm text-muted-foreground">
            It may have expired or you may not have access to it.
          </p>
        </div>
      ) : (
        <>
          <article className="overflow-hidden rounded-3xl border border-border bg-card">
            <div className="p-6 sm:p-8">
              <div className="mb-6 flex flex-wrap items-center gap-2">
                <PriorityBadge priority={announcement.priority} />
                <CategoryBadge category={String(announcement.category)} />
                <span className="inline-flex items-center rounded-full border border-border bg-muted/40 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  {announcement.departmentName ? "Departmental" : "Global"}
                </span>
                {announcement.pinned ? (
                  <span className="inline-flex items-center rounded-full border border-border bg-muted/40 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Pinned
                  </span>
                ) : null}
              </div>

              <h1 className="text-2xl font-semibold leading-tight tracking-tight sm:text-3xl">
                {announcement.title}
              </h1>

              <div className="mt-6 grid grid-cols-1 gap-4 rounded-2xl border border-border/60 bg-muted/20 p-4 sm:grid-cols-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-background">
                    <MaterialSymbol
                      icon="account_balance"
                      className="text-[18px] text-muted-foreground"
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      Sender
                    </p>
                    <p className="truncate text-sm font-semibold">
                      {announcement.departmentName ?? announcement.authorName}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-background">
                    <MaterialSymbol
                      icon="calendar_today"
                      className="text-[18px] text-muted-foreground"
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      Published
                    </p>
                    <p className="truncate text-sm font-semibold">
                      {announcement.publishedAt
                        ? timeAgo(announcement.publishedAt)
                        : timeAgo(announcement.createdAt)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-background">
                    <MaterialSymbol
                      icon="visibility"
                      className="text-[18px] text-muted-foreground"
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      Views
                    </p>
                    <p className="truncate text-sm font-semibold">
                      {announcement.viewCount}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span>By {announcement.authorName}</span>
                <span aria-hidden="true">•</span>
                <span>Expires: {formatDate(announcement.expiresAt)}</span>
              </div>

              {announcement.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={announcement.imageUrl}
                  alt="Announcement image"
                  className="mt-6 h-64 w-full rounded-2xl border border-border object-cover"
                />
              ) : null}

              {announcement.excerpt ? (
                <div className="mt-6 rounded-2xl border border-border bg-muted/20 p-4 text-sm text-muted-foreground">
                  {announcement.excerpt}
                </div>
              ) : null}
            </div>

            <div className="border-t border-border bg-background p-6 sm:p-8">
              <AnnouncementMarkdownPreview source={announcement.content} />
            </div>
          </article>

          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-lexend text-lg font-semibold tracking-tight">
                Related announcements
              </h2>
              <Button asChild variant="link">
                <Link href="/student/announcements">View all</Link>
              </Button>
            </div>

            {(data?.related?.length ?? 0) === 0 ? (
              <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
                No related announcements.
              </div>
            ) : (
              <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {(data?.related ?? []).map((a) => (
                  <li key={a.id}>
                    <Link
                      href={`/student/announcements/${a.id}`}
                      className={cn(
                        "block rounded-2xl border border-border bg-card p-5 transition-colors hover:bg-accent/30",
                      )}
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <PriorityBadge priority={a.priority} />
                        {a.pinned ? (
                          <span className="inline-flex items-center rounded-full border border-border bg-muted/40 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                            Pinned
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-2 text-sm font-semibold truncate">
                        {a.title}
                      </p>
                      <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                        {a.excerpt || "No excerpt provided."}
                      </p>
                      <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground">
                        <span className="inline-flex items-center gap-1 truncate">
                          <MaterialSymbol
                            icon="person"
                            className="text-[14px]"
                          />
                          {a.authorName}
                        </span>
                        <span className="whitespace-nowrap">
                          {a.publishedAt
                            ? timeAgo(a.publishedAt)
                            : timeAgo(a.createdAt)}
                        </span>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  );
}
