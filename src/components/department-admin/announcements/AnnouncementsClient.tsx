"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { MaterialSymbol } from "@/components/common/MaterialSymbol";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { getApiErrorLabel } from "@/lib/api-client-error";
import {
  useDepartmentAdminAnnouncementsList,
  useDepartmentAdminDeleteAnnouncement,
} from "@/services/department-admin/announcement/announcement";
import type {
  AdminAnnouncementListRow,
  AdminAnnouncementStatusFilter,
} from "@/types";

import EditAnnouncementDialog from "./EditAnnouncementDialog";

function StatCard({
  label,
  value,
  note,
  icon,
  loading,
}: {
  label: string;
  value: string;
  note: string;
  icon: string;
  loading?: boolean;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {label}
          </p>
          {loading ? (
            <Skeleton className="mt-3 h-8 w-24" />
          ) : (
            <p className="mt-2 font-display text-3xl font-semibold">{value}</p>
          )}
          <p className="mt-2 text-xs text-muted-foreground">{note}</p>
        </div>
        <div className="inline-flex h-11 w-11 items-center justify-center rounded-lg bg-muted text-foreground">
          <MaterialSymbol icon={icon} className="text-[22px]" />
        </div>
      </div>
    </div>
  );
}

function deriveStatus(row: AdminAnnouncementListRow): {
  key: AdminAnnouncementStatusFilter;
  label: string;
  className: string;
} {
  const now = Date.now();

  if (row.status === "DRAFT") {
    return {
      key: "DRAFT",
      label: "Draft",
      className: "bg-muted text-muted-foreground",
    };
  }

  const publishedAt = row.publishedAt
    ? new Date(row.publishedAt).getTime()
    : null;
  const expiresAt = row.expiresAt ? new Date(row.expiresAt).getTime() : null;

  if (publishedAt && publishedAt > now) {
    return {
      key: "SCHEDULED",
      label: "Scheduled",
      className: "bg-secondary text-secondary-foreground",
    };
  }

  if (row.status === "ARCHIVED" || (expiresAt && expiresAt <= now)) {
    return {
      key: "ARCHIVED",
      label: "Archived",
      className: "bg-destructive/10 text-destructive",
    };
  }

  return {
    key: "ACTIVE",
    label: "Active",
    className: "bg-primary/10 text-primary",
  };
}

function formatDate(iso: string | null): string {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString();
}

export default function AnnouncementsClient() {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<AdminAnnouncementStatusFilter>("ALL");
  const [page, setPage] = useState(1);

  const [editId, setEditId] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);

  const deleteMutation = useDepartmentAdminDeleteAnnouncement();

  const listParams = useMemo(
    () => ({
      q: q.trim() || undefined,
      status,
      page,
      pageSize: 10,
    }),
    [q, status, page],
  );

  const listQuery = useDepartmentAdminAnnouncementsList(listParams);
  const errorLabel = listQuery.error ? getApiErrorLabel(listQuery.error) : null;
  const errorText = errorLabel
    ? errorLabel.code
      ? `${errorLabel.message} (${errorLabel.code})`
      : errorLabel.message
    : null;

  const stats = listQuery.data?.stats;
  const rows = listQuery.data?.rows ?? [];

  const total = listQuery.data?.total ?? 0;
  const pageSize = listQuery.data?.pageSize ?? 10;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const openEdit = (id: string) => {
    setEditId(id);
    setEditOpen(true);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold">Announcement Management</h1>
          <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
            <span>Department Portal</span>
            <MaterialSymbol icon="chevron_right" className="text-sm" />
            <span className="text-primary">Announcements</span>
          </div>
        </div>

        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
          <div className="relative w-full sm:w-72">
            <MaterialSymbol
              icon="search"
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <input
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setPage(1);
              }}
              className="h-10 w-full rounded-full border border-input bg-background pl-10 pr-4 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              placeholder="Search announcements..."
            />
          </div>

          <Button asChild>
            <Link href="/department-admin/announcements/new">
              <MaterialSymbol icon="add" className="text-[18px]" />
              Create
            </Link>
          </Button>
        </div>
      </div>

      {errorText ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4">
          <p className="text-sm font-semibold">Failed to load announcements</p>
          <p className="mt-1 text-sm text-muted-foreground">{errorText}</p>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Active"
          value={String(stats?.totalActive ?? 0)}
          note="Published and visible now"
          icon="campaign"
          loading={listQuery.isPending}
        />
        <StatCard
          label="Scheduled"
          value={String(stats?.scheduled ?? 0)}
          note="Set to publish later"
          icon="schedule"
          loading={listQuery.isPending}
        />
        <StatCard
          label="High Priority"
          value={String(stats?.highPriority ?? 0)}
          note="Priority level 2+"
          icon="priority_high"
          loading={listQuery.isPending}
        />
        <StatCard
          label="Read Rate"
          value={stats?.readRate != null ? `${stats.readRate}%` : "-"}
          note="Active announcements with views"
          icon="analytics"
          loading={listQuery.isPending}
        />
      </div>

      <div className="rounded-2xl border border-border bg-card p-4">
        <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Status
        </label>
        <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-5">
          {(["ALL", "ACTIVE", "SCHEDULED", "DRAFT", "ARCHIVED"] as const).map(
            (s) => (
              <button
                key={s}
                type="button"
                className={cn(
                  "h-10 rounded-xl px-3 text-[11px] font-semibold uppercase tracking-wider",
                  status === s
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-accent hover:text-foreground",
                )}
                onClick={() => {
                  setStatus(s);
                  setPage(1);
                }}
              >
                {s === "ALL" ? "All" : s.toLowerCase()}
              </button>
            ),
          )}
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-muted/30 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                <th className="px-6 py-4">Status &amp; Priority</th>
                <th className="px-6 py-4">Announcement Details</th>
                <th className="px-6 py-4">Schedule</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-sm">
              {listQuery.isPending ? (
                Array.from({ length: 6 }).map((_, idx) => (
                  <tr key={idx} className="hover:bg-accent/20">
                    <td className="px-6 py-4">
                      <Skeleton className="h-6 w-24" />
                    </td>
                    <td className="px-6 py-4">
                      <Skeleton className="h-4 w-72" />
                      <Skeleton className="mt-2 h-3 w-96" />
                    </td>
                    <td className="px-6 py-4">
                      <Skeleton className="h-4 w-56" />
                      <Skeleton className="mt-2 h-3 w-44" />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Skeleton className="ml-auto h-8 w-24" />
                    </td>
                  </tr>
                ))
              ) : rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-6 py-10 text-center text-sm text-muted-foreground"
                  >
                    No announcements found.
                  </td>
                </tr>
              ) : (
                rows.map((row) => {
                  const statusMeta = deriveStatus(row);

                  return (
                    <tr key={row.id} className="hover:bg-accent/20">
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-2">
                          <span
                            className={cn(
                              "inline-flex w-fit rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider",
                              statusMeta.className,
                            )}
                          >
                            {statusMeta.label}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            Priority {row.priority}
                          </span>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <Link
                            href={`/department-admin/announcements/${row.id}`}
                            className="font-semibold text-foreground hover:text-primary"
                          >
                            {row.title}
                          </Link>
                          <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                            {row.excerpt || "—"}
                          </p>
                          <p className="mt-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                            {row.category.replaceAll("_", " ")}
                          </p>
                        </div>
                      </td>

                      <td className="px-6 py-4 text-xs text-muted-foreground">
                        <div className="flex flex-col">
                          <span>Published: {formatDate(row.publishedAt)}</span>
                          <span>Expires: {formatDate(row.expiresAt)}</span>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            aria-label="Edit announcement"
                            onClick={() => openEdit(row.id)}
                          >
                            <MaterialSymbol
                              icon="edit"
                              className="text-[18px] text-muted-foreground"
                            />
                          </Button>

                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            aria-label="Delete announcement"
                            disabled={deleteMutation.isPending}
                            onClick={() => {
                              deleteMutation
                                .mutateAsync(row.id)
                                .catch(() => undefined);
                            }}
                          >
                            <MaterialSymbol
                              icon="delete"
                              className="text-[18px] text-muted-foreground"
                            />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-border px-6 py-4 text-xs text-muted-foreground">
          <span>
            Showing {(page - 1) * pageSize + 1} -{" "}
            {Math.min(page * pageSize, total)} of {total}
          </span>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </Button>
            <span>
              {page} / {totalPages}
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Next
            </Button>
          </div>
        </div>
      </div>

      <EditAnnouncementDialog
        announcementId={editId}
        open={editOpen}
        onOpenChange={(v) => {
          setEditOpen(v);
          if (!v) setEditId(null);
        }}
      />
    </div>
  );
}
