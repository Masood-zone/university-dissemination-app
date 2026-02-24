"use client";

import { useRouter } from "next/navigation";

import { MaterialSymbol } from "@/components/common/MaterialSymbol";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getApiErrorLabel } from "@/lib/api-client-error";
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
    ? getApiErrorLabel(detailQuery.error)
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{a.title}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span>{a.category.replaceAll("_", " ")}</span>
            <span></span>
            <span>{a.department?.name ?? "Global"}</span>
            <span></span>
            <span>
              By {a.author.firstName} {a.author.lastName}
            </span>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span>Published: {formatDate(a.publishedAt)}</span>
            <span></span>
            <span>Expires: {formatDate(a.expiresAt)}</span>
            <span></span>
            <span>Views: {a.viewCount}</span>
          </div>
        </div>

        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            <MaterialSymbol icon="arrow_back" className="text-[18px]" />
            Back
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
      </div>

      {a.imageUrl ? (
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={a.imageUrl} alt="" className="h-auto w-full" />
        </div>
      ) : null}

      {a.excerpt ? (
        <div className="rounded-2xl border border-border bg-card p-4 text-sm text-muted-foreground">
          {a.excerpt}
        </div>
      ) : null}

      <div className="overflow-hidden rounded-2xl border border-border bg-card p-4">
        <AnnouncementMarkdownPreview source={a.content} />
      </div>
    </div>
  );
}
