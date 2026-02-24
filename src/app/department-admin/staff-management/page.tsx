"use client";

import { useEffect, useMemo, useState } from "react";

import { MaterialSymbol } from "@/components/common/MaterialSymbol";
import { BulkImportModal } from "@/components/department-admin/staff-management/BulkImportModal";
import { StaffUserModal } from "@/components/department-admin/staff-management/StaffUserModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { cn, getInitials } from "@/lib/utils";
import { useDepartmentAdminStaffList } from "@/services/department-admin/staff-management/staff-management";
import type {
  DepartmentAdminStaffListRow,
  DepartmentAdminStaffRoleFilter,
  DepartmentAdminStaffStatusFilter,
} from "@/types";

function StatCard({
  label,
  value,
  icon,
  note,
  tone,
}: {
  label: string;
  value: string;
  icon: string;
  note: string;
  tone?: "primary" | "blue" | "green" | "amber";
}) {
  const iconClass =
    tone === "blue"
      ? "text-primary"
      : tone === "green"
        ? "text-emerald-600"
        : tone === "amber"
          ? "text-amber-600"
          : "text-primary";

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {label}
          </p>
          <p className="mt-2 font-lexend text-2xl font-semibold tracking-tight">
            {value}
          </p>
          <p className="mt-1 text-[11px] text-muted-foreground">{note}</p>
        </div>
        <MaterialSymbol icon={icon} className={cn("text-[20px]", iconClass)} />
      </div>
    </div>
  );
}

function StatCardSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="mt-3 h-7 w-20" />
          <Skeleton className="mt-2 h-3 w-36" />
        </div>
        <Skeleton className="h-6 w-6 rounded" />
      </div>
    </div>
  );
}

function StatusPill({
  isActive,
  pending,
}: {
  isActive: boolean;
  pending: boolean;
}) {
  if (!isActive) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
        <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />
        Deactivated
      </span>
    );
  }

  if (pending) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
        Pending Auth
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
      Active
    </span>
  );
}

function RoleBadge({ role }: { role: "LECTURER" | "STUDENT" }) {
  const base =
    "rounded border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider";
  const klass =
    role === "LECTURER"
      ? "border-blue-200/50 bg-blue-50 text-blue-700"
      : "border-emerald-200/50 bg-emerald-50 text-emerald-700";

  return <span className={cn(base, klass)}>{role}</span>;
}

function Pagination({
  page,
  pageSize,
  total,
  onPageChange,
}: {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(total, page * pageSize);

  const visiblePages = Array.from(
    { length: Math.min(3, totalPages) },
    (_, i) => i + 1,
  );
  const tail = totalPages > 4 ? totalPages : null;

  return (
    <div className="flex flex-col gap-3 border-t border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-xs text-muted-foreground">
        Showing {start} - {end} of {total.toLocaleString()} users
      </p>

      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          aria-label="Previous page"
        >
          <MaterialSymbol icon="chevron_left" className="text-[18px]" />
        </Button>

        {visiblePages.map((p) => (
          <Button
            key={p}
            type="button"
            variant={p === page ? "default" : "outline"}
            size="icon-sm"
            onClick={() => onPageChange(p)}
            aria-label={`Page ${p}`}
          >
            {p}
          </Button>
        ))}

        {tail && !visiblePages.includes(tail) ? (
          <>
            <span className="px-1 text-xs text-muted-foreground">…</span>
            <Button
              type="button"
              variant={tail === page ? "default" : "outline"}
              size="icon-sm"
              onClick={() => onPageChange(tail)}
              aria-label={`Page ${tail}`}
            >
              {tail}
            </Button>
          </>
        ) : null}

        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          aria-label="Next page"
        >
          <MaterialSymbol icon="chevron_right" className="text-[18px]" />
        </Button>
      </div>
    </div>
  );
}

export default function DepartmentAdminStaffManagementPage() {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [role, setRole] = useState<DepartmentAdminStaffRoleFilter>("ALL");
  const [status, setStatus] = useState<DepartmentAdminStaffStatusFilter>("ALL");
  const [page, setPage] = useState(1);

  const [createOpen, setCreateOpen] = useState(false);
  const [editUserId, setEditUserId] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);

  useEffect(() => {
    const handle = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(handle);
  }, [searchInput]);

  const listQuery = useDepartmentAdminStaffList({
    search,
    role,
    status,
    page,
    limit: 25,
  });

  const stats = listQuery.data?.stats;
  const rows: DepartmentAdminStaffListRow[] = listQuery.data?.rows ?? [];

  const pageSize = listQuery.data?.pageSize ?? 25;
  const total = listQuery.data?.total ?? 0;

  const headerTitle = useMemo(() => {
    if (role === "LECTURER") return "Lecturer Management";
    if (role === "STUDENT") return "Student Management";
    return "Staff Management";
  }, [role]);

  return (
    <section className="space-y-6">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <MaterialSymbol
            icon="manage_accounts"
            className="text-[22px] text-muted-foreground"
          />
          <div>
            <h1 className="font-lexend text-2xl font-semibold tracking-tight">
              {headerTitle}
            </h1>
            <p className="text-sm text-muted-foreground">
              Manage lecturers and students in your department.
            </p>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        {listQuery.isPending ? (
          Array.from({ length: 4 }).map((_, idx) => (
            <StatCardSkeleton key={idx} />
          ))
        ) : (
          <>
            <StatCard
              label="Total Users"
              value={(stats?.totalUsers ?? 0).toLocaleString()}
              note="In your department"
              icon="groups"
              tone="primary"
            />
            <StatCard
              label="Lecturers"
              value={(stats?.lecturers ?? 0).toLocaleString()}
              note="Department lecturers"
              icon="school"
              tone="blue"
            />
            <StatCard
              label="Students"
              value={(stats?.students ?? 0).toLocaleString()}
              note="Active enrollment"
              icon="face"
              tone="green"
            />
            <StatCard
              label="Pending Auth"
              value={(stats?.pendingAuth ?? 0).toLocaleString()}
              note="Requires approval"
              icon="lock_open"
              tone="amber"
            />
          </>
        )}
      </div>

      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-center">
          <div className="relative flex-1">
            <MaterialSymbol
              icon="search"
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-muted-foreground"
            />
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by name or email..."
              className="pl-10"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Select
              value={role}
              onChange={(e) => {
                setRole(e.target.value as DepartmentAdminStaffRoleFilter);
                setPage(1);
              }}
              className="w-40"
            >
              <option value="ALL">All Roles</option>
              <option value="LECTURER">Lecturers</option>
              <option value="STUDENT">Students</option>
            </Select>

            <Select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value as DepartmentAdminStaffStatusFilter);
                setPage(1);
              }}
              className="w-40"
            >
              <option value="ALL">Any Status</option>
              <option value="ACTIVE">Active</option>
              <option value="DEACTIVATED">Deactivated</option>
              <option value="PENDING_AUTH">Pending Auth</option>
            </Select>

            <div className="hidden lg:block h-6 w-px bg-border" />

            <Button type="button" onClick={() => setCreateOpen(true)}>
              <MaterialSymbol icon="person_add" className="text-[18px]" />
              Add User
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={() => setImportOpen(true)}
            >
              <MaterialSymbol icon="upload_file" className="text-[18px]" />
              Bulk Import
            </Button>
          </div>
        </div>
      </div>

      {listQuery.isError ? (
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-sm font-semibold">Failed to load staff</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {listQuery.error instanceof Error
              ? listQuery.error.message
              : "Please refresh and try again."}
          </p>
        </div>
      ) : null}

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-muted/30 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                <th className="px-6 py-4">User Details</th>
                <th className="px-6 py-4">System ID</th>
                <th className="px-6 py-4">Primary Role</th>
                <th className="px-6 py-4">Department / Level</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-sm">
              {listQuery.isPending ? (
                Array.from({ length: 6 }).map((_, idx) => (
                  <tr key={idx} className="hover:bg-accent/20">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div>
                          <Skeleton className="h-4 w-44" />
                          <Skeleton className="mt-2 h-3 w-52" />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Skeleton className="h-4 w-32" />
                    </td>
                    <td className="px-6 py-4">
                      <Skeleton className="h-6 w-20" />
                    </td>
                    <td className="px-6 py-4">
                      <Skeleton className="h-4 w-36" />
                    </td>
                    <td className="px-6 py-4">
                      <Skeleton className="h-6 w-24" />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Skeleton className="ml-auto h-8 w-20" />
                    </td>
                  </tr>
                ))
              ) : rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-10 text-center text-sm text-muted-foreground"
                  >
                    No users found.
                  </td>
                </tr>
              ) : (
                rows.map((row) => {
                  const fullName = `${row.firstName} ${row.lastName}`.trim();
                  const initials = getInitials(fullName);
                  const pendingAuth = !row.emailVerified;

                  return (
                    <tr
                      key={row.id}
                      className={cn(
                        "transition-colors hover:bg-accent/20",
                        !row.isActive ? "opacity-60 grayscale" : null,
                      )}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-sm font-bold text-foreground">
                            {initials}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-foreground truncate">
                              {fullName}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {row.email}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4 font-mono text-xs text-muted-foreground">
                        {row.systemId ?? "—"}
                      </td>

                      <td className="px-6 py-4">
                        <RoleBadge role={row.role} />
                      </td>

                      <td className="px-6 py-4 text-xs text-muted-foreground">
                        <div className="flex flex-col">
                          <span>{row.departmentName}</span>
                          {row.levelOrMeta ? (
                            <span className="text-[11px]">
                              {row.levelOrMeta}
                            </span>
                          ) : null}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <StatusPill
                          isActive={row.isActive}
                          pending={pendingAuth}
                        />
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            aria-label="Edit user"
                            onClick={() => {
                              setEditUserId(row.id);
                              setEditOpen(true);
                            }}
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
                            aria-label="Deactivate user"
                            disabled={!row.isActive}
                            onClick={() => {
                              setEditUserId(row.id);
                              setEditOpen(true);
                            }}
                          >
                            <MaterialSymbol
                              icon="block"
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

        <Pagination
          page={page}
          pageSize={pageSize}
          total={total}
          onPageChange={(p) => setPage(p)}
        />
      </div>

      <StaffUserModal
        open={createOpen}
        onOpenChange={setCreateOpen}
        mode={{ type: "create" }}
      />

      <StaffUserModal
        open={editOpen}
        onOpenChange={(v) => {
          setEditOpen(v);
          if (!v) setEditUserId(null);
        }}
        mode={
          editUserId ? { type: "edit", userId: editUserId } : { type: "create" }
        }
      />

      <BulkImportModal open={importOpen} onOpenChange={setImportOpen} />
    </section>
  );
}
