"use client";

import { useRouter } from "next/navigation";

import { MaterialSymbol } from "@/components/common/MaterialSymbol";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getApiErrorLabel } from "@/lib/api-client-error";
import { cn } from "@/lib/utils";
import { useAdminAnnouncementDetail } from "@/services/admin/announcements/announcements";

import { AnnouncementMarkdownPreview } from "./AnnouncementMarkdown";

function formatDate(iso: string | null): string {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString();
}

export default function AnnouncementDetailClient({ id }: { id: string }) {
  const router = useRouter();
  const detailQuery = useAdminAnnouncementDetail(id);

  const errorLabel = detailQuery.error
    ? getApiErrorLabel(detailQuery.error).message
    : null;

  if (detailQuery.isPending) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-8 w-80" />
        <Skeleton className="h-4 w-96" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (errorLabel || !detailQuery.data) {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4">
        <p className="text-sm font-semibold">Failed to load announcement</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {errorLabel ?? "Not found"}
        </p>
        <div className="mt-4">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            <MaterialSymbol icon="arrow_back" className="text-[18px]" />
            Back
          </Button>
        </div>
      </div>
    );
  }

  const a = detailQuery.data;
  const priorityTone =
    a.priority >= 3
      ? "border-destructive/30 bg-destructive/10 text-destructive"
      : a.priority >= 2
        ? "border-primary/30 bg-primary/10 text-primary"
        : "border-border bg-muted/40 text-muted-foreground";

  const priorityLabel =
    a.priority >= 3 ? "Critical" : a.priority >= 2 ? "High Priority" : "Normal";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <Button
          type="button"
          variant="ghost"
          className="px-0 text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-primary"
          onClick={() => router.back()}
        >
          <MaterialSymbol icon="arrow_back" className="text-[18px]" />
          Back to feed
        </Button>

        <Button
          type="button"
          variant="secondary"
          onClick={() => window.print()}
        >
          <MaterialSymbol icon="print" className="text-[18px]" />
          Print
        </Button>
      </div>

      <article className="overflow-hidden rounded-3xl border border-border bg-card">
        <div className="p-6 sm:p-8">
          <div className="mb-6 flex flex-wrap items-center gap-2">
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-wider",
                priorityTone,
              )}
            >
              {a.priority >= 2 ? (
                <MaterialSymbol icon="priority_high" className="text-[14px]" />
              ) : null}
              {priorityLabel}
            </span>
            <span className="inline-flex items-center rounded-full border border-border bg-primary/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-primary">
              {a.category.replaceAll("_", " ")}
            </span>
            {a.pinned ? (
              <span className="inline-flex items-center rounded-full border border-border bg-muted/40 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Pinned
              </span>
            ) : null}
          </div>

          <h1 className="text-2xl font-semibold leading-tight tracking-tight sm:text-3xl">
            {a.title}
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
                  {a.department?.name ?? "Global"}
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
                  {formatDate(a.publishedAt)}
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
                <p className="truncate text-sm font-semibold">{a.viewCount}</p>
              </div>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span>
              By {a.author.firstName} {a.author.lastName}
            </span>
            <span aria-hidden="true">•</span>
            <span>Expires: {formatDate(a.expiresAt)}</span>
          </div>

          {a.imageUrl ? (
            <div className="mt-6 overflow-hidden rounded-2xl border border-border bg-card">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={a.imageUrl} alt="" className="h-auto w-full" />
            </div>
          ) : null}

          {a.excerpt ? (
            <div className="mt-6 rounded-2xl border border-border bg-muted/20 p-4 text-sm text-muted-foreground">
              {a.excerpt}
            </div>
          ) : null}
        </div>

        <div className="border-t border-border bg-background p-6 sm:p-8">
          <AnnouncementMarkdownPreview source={a.content} />
        </div>
      </article>
    </div>
  );
}
