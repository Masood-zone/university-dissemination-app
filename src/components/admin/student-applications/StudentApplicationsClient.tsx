"use client";

import { useMemo, useState } from "react";

import { MaterialSymbol } from "@/components/common/MaterialSymbol";
import { cn } from "@/lib/utils";
import { getApiErrorLabel } from "@/lib/api-client-error";
import {
  useGetEnrollmentDepartments,
  useGetEnrollmentProgrammes,
} from "@/services/enrollment/enrollment";
import {
  useAdminStudentApplicationDetail,
  useAdminStudentApplicationsList,
  useApproveStudentApplication,
  useRejectStudentApplication,
} from "@/services/admin/student-applications/student-applications";

import RejectApplicationModal from "./RejectApplicationModal";

function initials(name: string): string {
  const parts = name
    .split(" ")
    .map((p) => p.trim())
    .filter(Boolean);

  if (!parts.length) return "?";
  const first = parts[0]?.[0] ?? "";
  const second = parts.length > 1 ? parts[1]?.[0] ?? "" : "";
  return (first + second).toUpperCase();
}

function statusLabel(status: string): string {
  switch (status) {
    case "SUBMITTED":
      return "Pending";
    case "UNDER_REVIEW":
      return "Under review";
    case "SHORTLISTED":
      return "Shortlisted";
    case "APPROVED":
      return "Approved";
    case "REJECTED":
      return "Rejected";
    default:
      return status.replaceAll("_", " ").toLowerCase();
  }
}

function statusPillClass(status: string): string {
  switch (status) {
    case "SUBMITTED":
      return "bg-primary/10 text-primary";
    case "UNDER_REVIEW":
      return "bg-secondary text-secondary-foreground";
    case "APPROVED":
      return "bg-accent text-accent-foreground";
    case "REJECTED":
      return "bg-destructive/10 text-destructive";
    default:
      return "bg-muted text-muted-foreground";
  }
}

export default function StudentApplicationsClient() {
  const [departmentId, setDepartmentId] = useState<string>("");
  const [programmeId, setProgrammeId] = useState<string>("");
  const [status, setStatus] = useState<string>("SUBMITTED");
  const [q, setQ] = useState<string>("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectError, setRejectError] = useState<string | null>(null);

  const departmentsQuery = useGetEnrollmentDepartments();
  const programmesQuery = useGetEnrollmentProgrammes(departmentId || null);

  const listParams = useMemo(
    () => ({
      q: q.trim() || undefined,
      departmentId: departmentId || undefined,
      programmeId: programmeId || undefined,
      status,
      take: 50,
    }),
    [q, departmentId, programmeId, status],
  );

  const applicationsQuery = useAdminStudentApplicationsList(listParams);
  const detailQuery = useAdminStudentApplicationDetail(selectedId);

  const approveMutation = useApproveStudentApplication();
  const rejectMutation = useRejectStudentApplication();

  const listError = applicationsQuery.error
    ? getApiErrorLabel(applicationsQuery.error)
    : null;
  const detailError = detailQuery.error ? getApiErrorLabel(detailQuery.error) : null;

  const rows = applicationsQuery.data?.rows ?? [];
  const selected = detailQuery.data;

  const showSidebar = Boolean(selectedId);

  const docsVerifiedLabel = selected
    ? selected.documents.length
      ? selected.documents.every((d) => d.isVerified)
        ? "Docs verified"
        : "Docs pending"
      : "No documents"
    : "";

  const disableActions =
    selected?.status === "APPROVED" || selected?.status === "REJECTED";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold">
            Application Review &amp; Approval
          </h1>
          <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
            <span>Academic Management</span>
            <MaterialSymbol icon="chevron_right" className="text-sm" />
            <span className="text-primary">Application Review</span>
          </div>
        </div>

        <div className="relative w-full sm:w-72">
          <MaterialSymbol
            icon="search"
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="h-10 w-full rounded-full border border-input bg-background pl-10 pr-4 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            placeholder="Search applications..."
          />
        </div>
      </div>

      <div
        className={cn(
          "grid gap-6",
          showSidebar ? "lg:grid-cols-[1fr_420px]" : "lg:grid-cols-1",
        )}
      >
        <section className="flex min-w-0 flex-col gap-4">
          <div className="rounded-2xl border border-border bg-card p-4">
            <div className="grid gap-4 md:grid-cols-3 md:items-end">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Department
                </label>
                <select
                  value={departmentId}
                  onChange={(e) => {
                    const next = e.target.value;
                    setDepartmentId(next);
                    setProgrammeId("");
                  }}
                  className="mt-2 h-10 w-full rounded-xl border border-input bg-background px-3 text-sm"
                >
                  <option value="">All Departments</option>
                  {(departmentsQuery.data ?? []).map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Programme
                </label>
                <select
                  value={programmeId}
                  onChange={(e) => setProgrammeId(e.target.value)}
                  className="mt-2 h-10 w-full rounded-xl border border-input bg-background px-3 text-sm disabled:opacity-60"
                  disabled={!departmentId}
                >
                  <option value="">All Programmes</option>
                  {(programmesQuery.data ?? []).map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Status
                </label>
                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    className={cn(
                      "h-10 flex-1 rounded-xl px-3 text-xs font-semibold uppercase tracking-wider",
                      status === "SUBMITTED"
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-secondary-foreground hover:bg-accent",
                    )}
                    onClick={() => setStatus("SUBMITTED")}
                  >
                    Pending
                  </button>
                  <button
                    type="button"
                    className={cn(
                      "h-10 flex-1 rounded-xl px-3 text-xs font-semibold uppercase tracking-wider",
                      status === "UNDER_REVIEW"
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-secondary-foreground hover:bg-accent",
                    )}
                    onClick={() => setStatus("UNDER_REVIEW")}
                  >
                    Under review
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-border bg-card">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-muted/50 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    <th className="px-6 py-4">Applicant ID</th>
                    <th className="px-6 py-4">Student Name</th>
                    <th className="px-6 py-4">Department</th>
                    <th className="px-6 py-4">Programme</th>
                    <th className="px-6 py-4">Date Applied</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {applicationsQuery.isLoading ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-6 py-8 text-sm text-muted-foreground"
                      >
                        Loading applications...
                      </td>
                    </tr>
                  ) : listError ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-8 text-sm">
                        <p className="font-medium">{listError.message}</p>
                        {listError.code ? (
                          <p className="mt-1 text-xs text-muted-foreground">
                            {listError.code}
                          </p>
                        ) : null}
                      </td>
                    </tr>
                  ) : rows.length ? (
                    rows.map((row) => {
                      const active = row.id === selectedId;
                      const dt = new Date(row.submittedAt);
                      const dateLabel = Number.isFinite(dt.getTime())
                        ? dt.toLocaleDateString()
                        : row.submittedAt;

                      return (
                        <tr
                          key={row.id}
                          className={cn(
                            "cursor-pointer text-sm transition-colors",
                            active ? "bg-primary/5" : "hover:bg-accent/50",
                          )}
                          onClick={() => setSelectedId(row.id)}
                        >
                          <td className="px-6 py-4 font-mono text-xs font-semibold">
                            {row.applicationNo}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-xs font-semibold">
                                {initials(row.studentName)}
                              </div>
                              <div className="min-w-0">
                                <p className="truncate font-medium">
                                  {row.studentName}
                                </p>
                                <p className="mt-0.5 text-xs text-muted-foreground">
                                  {row.docsVerifiedCount}/{row.docsCount} docs
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-muted-foreground">
                            {row.departmentName}
                          </td>
                          <td className="px-6 py-4 text-muted-foreground">
                            {row.programmeName}
                          </td>
                          <td className="px-6 py-4 text-muted-foreground">
                            {dateLabel}
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={cn(
                                "inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider",
                                statusPillClass(row.status),
                              )}
                            >
                              {statusLabel(row.status)}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button
                              type="button"
                              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-background hover:bg-accent"
                              aria-label="View application"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedId(row.id);
                              }}
                            >
                              <MaterialSymbol icon="chevron_right" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-6 py-8 text-sm text-muted-foreground"
                      >
                        No applications found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {showSidebar ? (
          <aside
            className={cn(
              "rounded-2xl border border-border bg-card",
              "lg:sticky lg:top-24 lg:h-[calc(100vh-8rem)]",
              "flex flex-col overflow-hidden",
            )}
          >
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <h3 className="text-sm font-semibold">Application Details</h3>
              <button
                type="button"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-background hover:bg-accent"
                aria-label="Close"
                onClick={() => setSelectedId(null)}
              >
                <MaterialSymbol icon="close" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              {detailQuery.isLoading ? (
                <p className="text-sm text-muted-foreground">
                  Loading details...
                </p>
              ) : detailError ? (
                <div className="text-sm">
                  <p className="font-medium">{detailError.message}</p>
                  {detailError.code ? (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {detailError.code}
                    </p>
                  ) : null}
                </div>
              ) : selected ? (
                <div className="space-y-5">
                  <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground font-semibold">
                      {initials(selected.studentName)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">
                        {selected.studentName}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        Application ID: {selected.applicationNo}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <span
                          className={cn(
                            "inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider",
                            statusPillClass(selected.status),
                          )}
                        >
                          {statusLabel(selected.status)}
                        </span>
                        <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                          {docsVerifiedLabel}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-border bg-background p-4">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Target programme
                    </p>
                    <div className="mt-3 space-y-2 text-sm">
                      <div>
                        <p className="text-xs text-muted-foreground">Department</p>
                        <p className="font-medium">{selected.department.name}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Selected programme
                        </p>
                        <p className="font-medium">{selected.programme.name}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Email</p>
                        <p className="font-medium">{selected.applicantEmail}</p>
                      </div>
                      {selected.applicantPhone ? (
                        <div>
                          <p className="text-xs text-muted-foreground">Phone</p>
                          <p className="font-medium">{selected.applicantPhone}</p>
                        </div>
                      ) : null}
                    </div>
                  </div>

                  {selected.notes ? (
                    <div className="rounded-2xl border border-border bg-background p-4">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Notes
                      </p>
                      <p className="mt-2 text-sm text-muted-foreground">
                        {selected.notes}
                      </p>
                    </div>
                  ) : null}

                  <div className="rounded-2xl border border-border bg-background p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Documents
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {selected.documents.filter((d) => d.isVerified).length}/
                        {selected.documents.length}
                      </p>
                    </div>
                    {selected.documents.length ? (
                      <div className="mt-3 space-y-2">
                        {selected.documents.slice(0, 6).map((doc) => (
                          <a
                            key={doc.id}
                            href={doc.fileUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card px-3 py-2 text-sm hover:bg-accent"
                          >
                            <div className="min-w-0">
                              <p className="truncate font-medium">
                                {doc.fileName}
                              </p>
                              <p className="mt-0.5 text-xs text-muted-foreground">
                                {doc.type.replaceAll("_", " ")}
                              </p>
                            </div>
                            <span
                              className={cn(
                                "shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider",
                                doc.isVerified
                                  ? "bg-primary/10 text-primary"
                                  : "bg-muted text-muted-foreground",
                              )}
                            >
                              {doc.isVerified ? "Verified" : "Pending"}
                            </span>
                          </a>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-2 text-sm text-muted-foreground">
                        No documents uploaded yet.
                      </p>
                    )}
                  </div>

                  <div className="rounded-2xl border border-border bg-background p-4">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Status history
                    </p>
                    {selected.statusHistory.length ? (
                      <div className="mt-3 space-y-2">
                        {selected.statusHistory.slice(0, 6).map((h) => (
                          <div
                            key={h.id}
                            className="rounded-xl border border-border bg-card px-3 py-2"
                          >
                            <div className="flex items-center justify-between gap-3">
                              <p className="text-sm font-medium">
                                {statusLabel(h.toStatus)}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(h.createdAt).toLocaleString()}
                              </p>
                            </div>
                            {h.note ? (
                              <p className="mt-1 text-sm text-muted-foreground">
                                {h.note}
                              </p>
                            ) : null}
                            {h.changedBy ? (
                              <p className="mt-1 text-xs text-muted-foreground">
                                By {h.changedBy.name}
                              </p>
                            ) : null}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-2 text-sm text-muted-foreground">
                        No status history yet.
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Select an application to view details.
                </p>
              )}
            </div>

            <div className="border-t border-border p-5">
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-primary text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60"
                  onClick={() => selectedId && approveMutation.mutate(selectedId)}
                  disabled={!selectedId || approveMutation.isPending || disableActions}
                >
                  {approveMutation.isPending
                    ? "Approving..."
                    : "Approve application"}
                </button>

                <button
                  type="button"
                  className="inline-flex h-11 w-full items-center justify-center rounded-xl border border-destructive bg-background text-sm font-semibold text-destructive hover:bg-destructive/10 disabled:opacity-60"
                  onClick={() => {
                    setRejectError(null);
                    setRejectOpen(true);
                  }}
                  disabled={!selectedId || rejectMutation.isPending || disableActions}
                >
                  Reject
                </button>
              </div>
            </div>
          </aside>
        ) : null}
      </div>

      <RejectApplicationModal
        open={rejectOpen}
        submitting={rejectMutation.isPending}
        error={rejectError}
        onClose={() => {
          if (rejectMutation.isPending) return;
          setRejectOpen(false);
          setRejectError(null);
        }}
        onSubmit={(reason) => {
          if (!selectedId) return;
          setRejectError(null);
          rejectMutation.mutate(
            { applicationId: selectedId, reason },
            {
              onSuccess: () => {
                setRejectOpen(false);
                setRejectError(null);
              },
              onError: (err) => {
                const parsed = getApiErrorLabel(err);
                setRejectError(parsed.message);
              },
            },
          );
        }}
      />
    </div>
  );
}
