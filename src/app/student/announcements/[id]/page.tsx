"use client";

import * as React from "react";
import Link from "next/link";

import { MaterialSymbol } from "@/components/common/MaterialSymbol";
import { AnnouncementMarkdownPreview } from "@/components/admin/announcements/AnnouncementMarkdown";
import { Button } from "@/components/ui/button";
import { cn, timeAgo } from "@/lib/utils";
import { useStudentAnnouncementDetail } from "@/services/announcements/announcements";

function PriorityPill({ priority }: { priority: number }) {
  const label =
    priority >= 3 ? "Critical" : priority >= 2 ? "High" : "Normal";

  return (
    <span className="inline-flex items-center rounded-full border border-border bg-muted/40 px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
      {label}
    </span>
  );
}

export default function StudentAnnouncementDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const id = params.id;
  const { data, isLoading, error } = useStudentAnnouncementDetail(id, true);

  const announcement = data?.announcement;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <Button asChild variant="outline">
          <Link href="/student/announcements" className="inline-flex items-center">
            <MaterialSymbol icon="arrow_back" className="text-[18px]" />
            Back
          </Link>
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <div className="h-10 w-2/3 rounded-xl bg-muted/40 animate-pulse" />
          <div className="h-6 w-1/2 rounded-xl bg-muted/40 animate-pulse" />
          <div className="h-80 rounded-2xl border border-border bg-card animate-pulse" />
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-border bg-card p-6">
          <p className="text-sm font-semibold">Failed to load announcement</p>
          <p className="mt-1 text-sm text-muted-foreground">Please try again.</p>
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
          <header className="rounded-2xl border border-border bg-card p-6">
            <div className="flex flex-wrap items-center gap-2">
              {announcement.pinned ? (
                <span className="inline-flex items-center rounded-full border border-border bg-muted/40 px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
                  Pinned
                </span>
              ) : null}
              <PriorityPill priority={announcement.priority} />
              {announcement.departmentName ? (
                <span className="inline-flex items-center rounded-full border border-border bg-muted/40 px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
                  {announcement.departmentName}
                </span>
              ) : (
                <span className="inline-flex items-center rounded-full border border-border bg-muted/40 px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
                  Global
                </span>
              )}
            </div>

            <h1 className="mt-3 font-lexend text-2xl font-semibold tracking-tight">
              {announcement.title}
            </h1>

            <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <MaterialSymbol icon="person" className="text-[16px]" />
                {announcement.authorName}
              </span>
              <span className="inline-flex items-center gap-1">
                <MaterialSymbol icon="schedule" className="text-[16px]" />
                {announcement.publishedAt
                  ? timeAgo(announcement.publishedAt)
                  : timeAgo(announcement.createdAt)}
              </span>
              <span className="inline-flex items-center gap-1">
                <MaterialSymbol icon="visibility" className="text-[16px]" />
                {announcement.viewCount}
              </span>
            </div>

            {announcement.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={announcement.imageUrl}
                alt="Announcement image"
                className="mt-5 h-56 w-full rounded-2xl border border-border object-cover"
              />
            ) : null}
          </header>

          <section className="rounded-2xl border border-border bg-card p-6">
            <AnnouncementMarkdownPreview source={announcement.content} />
          </section>

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
                        {a.pinned ? (
                          <span className="inline-flex items-center rounded-full border border-border bg-muted/40 px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
                            Pinned
                          </span>
                        ) : null}
                        <PriorityPill priority={a.priority} />
                      </div>
                      <p className="mt-2 text-sm font-semibold truncate">{a.title}</p>
                      <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                        {a.excerpt || "No excerpt provided."}
                      </p>
                      <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground">
                        <span className="inline-flex items-center gap-1 truncate">
                          <MaterialSymbol icon="person" className="text-[14px]" />
                          {a.authorName}
                        </span>
                        <span className="whitespace-nowrap">
                          {a.publishedAt ? timeAgo(a.publishedAt) : timeAgo(a.createdAt)}
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
