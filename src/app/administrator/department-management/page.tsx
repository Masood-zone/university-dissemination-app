"use client";

import * as React from "react";
import Link from "next/link";

import { MaterialSymbol } from "@/components/common/MaterialSymbol";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { DepartmentStat } from "@/components/admin/department-management/DepartmentStat";
import {
  useGetDepartmentHeads,
  useGetDepartmentInfo,
  useUpdateDepartmentHod,
} from "@/services/admin/department-management/department";
import type { DepartmentSummary } from "@/types";

function getInitials(value: string) {
  const parts = value
    .split(" ")
    .map((s) => s.trim())
    .filter(Boolean);
  if (parts.length === 0) return "—";
  return parts
    .slice(0, 2)
    .map((s) => s[0] ?? "")
    .join("")
    .toUpperCase();
}

export default function DepartmentManagementPage() {
  const [query, setQuery] = React.useState("");
  const [selectedDept, setSelectedDept] =
    React.useState<DepartmentSummary | null>(null);
  const [assignmentOpen, setAssignmentOpen] = React.useState(false);
  const [staffQuery, setStaffQuery] = React.useState("");
  const [selectedStaffId, setSelectedStaffId] = React.useState<string | null>(
    null,
  );

  const { data: deptInfo, isLoading: deptLoading } = useGetDepartmentInfo();
  const { data: heads, isLoading: headsLoading } = useGetDepartmentHeads();
  const updateHod = useUpdateDepartmentHod();

  const filteredDepartments = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    const base = deptInfo?.departments ?? [];
    if (!q) return base;
    return base.filter((d) => d.name.toLowerCase().includes(q));
  }, [deptInfo?.departments, query]);

  const filteredStaff = React.useMemo(() => {
    const q = staffQuery.trim().toLowerCase();
    const base = heads ?? [];
    if (!q) return base;
    return base.filter((s) =>
      `${s.firstName} ${s.lastName}`.toLowerCase().includes(q),
    );
  }, [heads, staffQuery]);

  const openAssignment = (dept: DepartmentSummary) => {
    setSelectedDept(dept);
    setSelectedStaffId(null);
    setStaffQuery("");
    setAssignmentOpen(true);
  };

  const saveAssignment = async () => {
    if (!selectedDept || !selectedStaffId) return;
    await updateHod.mutateAsync({
      departmentId: selectedDept.id,
      headUserId: selectedStaffId,
    });
    setAssignmentOpen(false);
  };

  return (
    <section className="space-y-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="font-display text-xl font-semibold">
            Departments & Faculty Management
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Browse departments and assign department heads.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative">
            <MaterialSymbol
              icon="search"
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-muted-foreground"
            />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search departments..."
              className="pl-9 w-full sm:w-72"
            />
          </div>

          <Button asChild className="gap-2">
            <Link href="/administrator/department-management/create-department">
              <MaterialSymbol icon="add" className="text-[18px]" />
              Create Department
            </Link>
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <DepartmentStat
          label="Total Departments"
          value={deptInfo?.stats.totalDepartments ?? 0}
        />
        <DepartmentStat
          label="Total Programmes"
          value={deptInfo?.stats.totalProgrammes ?? 0}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {filteredDepartments.map((dept) => (
          <button
            key={dept.id}
            type="button"
            onClick={() => openAssignment(dept)}
            className="text-left rounded-xl border border-border bg-card p-5 hover:bg-accent/40 transition-colors"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-muted text-foreground">
                <MaterialSymbol icon="business" className="text-[22px]" />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label="More actions"
                onClick={(e) => e.preventDefault()}
              >
                <MaterialSymbol icon="more_vert" className="text-[18px]" />
              </Button>
            </div>

            <div className="mt-4">
              <p className="font-display text-lg font-semibold leading-tight">
                {dept.name}
              </p>
              <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                <MaterialSymbol icon="badge" className="text-[16px]" />
                <span>Code: {dept.code}</span>
              </div>
            </div>

            <div className="mt-4 rounded-lg border border-border bg-background p-4">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Head of Department
              </p>
              <div className="mt-2 flex items-center justify-between gap-3">
                <p
                  className={cn(
                    "text-sm font-semibold",
                    !dept.headOfDept && "text-muted-foreground",
                  )}
                >
                  {dept.headOfDept ?? "Unassigned"}
                </p>
                <div className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-muted text-foreground text-xs font-semibold">
                  {dept.headOfDept ? getInitials(dept.headOfDept) : "—"}
                </div>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between gap-3 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <MaterialSymbol icon="menu_book" className="text-[18px]" />
                <span>{dept.programmesCount} Programmes</span>
              </div>
              {typeof dept.studentsCount === "number" ? (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MaterialSymbol icon="groups" className="text-[18px]" />
                  <span>{dept.studentsCount}+ Students</span>
                </div>
              ) : null}
            </div>

            <div className="mt-5">
              <Button variant="outline" className="w-full gap-2" type="button">
                <MaterialSymbol icon="edit" className="text-[18px]" />
                Change HOD
              </Button>
            </div>
          </button>
        ))}
      </div>

      {deptLoading ? (
        <p className="text-sm text-muted-foreground">Loading departments…</p>
      ) : null}

      <Dialog open={assignmentOpen} onOpenChange={setAssignmentOpen}>
        <DialogContent
          className={cn(
            "fixed right-0 top-0 left-auto h-dvh w-full max-w-md translate-x-0 translate-y-0 rounded-none border-l border-border p-0 sm:max-w-md sm:rounded-l-xl",
          )}
          showCloseButton
        >
          <div className="flex h-dvh flex-col">
            <DialogHeader className="border-b border-border p-6 text-left">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <DialogTitle>Assign Department Head</DialogTitle>
                  <DialogDescription>Faculty selection</DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              <div className="rounded-xl border border-border bg-card p-4">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Target Department
                </p>
                <p className="mt-2 text-sm font-semibold">
                  {selectedDept?.name ?? "—"}
                </p>
              </div>

              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Available Staff
                </p>
                <div className="relative mt-2">
                  <MaterialSymbol
                    icon="search"
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-muted-foreground"
                  />
                  <Input
                    value={staffQuery}
                    onChange={(e) => setStaffQuery(e.target.value)}
                    placeholder="Search staff by name or ID..."
                    className="pl-9"
                  />
                </div>

                <div className="mt-4 space-y-3">
                  {filteredStaff.map((staff) => {
                    const selected = selectedStaffId === staff.id;
                    const fullName =
                      `${staff.firstName} ${staff.lastName}`.trim();
                    return (
                      <button
                        key={staff.id}
                        type="button"
                        onClick={() => setSelectedStaffId(staff.id)}
                        className={cn(
                          "w-full rounded-xl border p-4 text-left transition-colors",
                          selected
                            ? "border-primary bg-primary/10"
                            : "border-border bg-background hover:bg-accent/40",
                        )}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-foreground text-xs font-semibold">
                              {getInitials(fullName)}
                            </div>
                            <div>
                              <p className="text-sm font-semibold">
                                {fullName}
                              </p>
                              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                                DEPARTMENT ADMIN
                              </p>
                            </div>
                          </div>

                          <div
                            className={cn(
                              "flex h-5 w-5 items-center justify-center rounded-full border",
                              selected
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-border bg-background",
                            )}
                            aria-hidden
                          >
                            {selected ? (
                              <MaterialSymbol
                                icon="check"
                                className="text-[16px]"
                              />
                            ) : null}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {headsLoading ? (
                  <p className="mt-3 text-sm text-muted-foreground">
                    Loading department heads…
                  </p>
                ) : null}
              </div>
            </div>

            <div className="border-t border-border p-6 space-y-3">
              <Button
                className="w-full gap-2"
                disabled={!selectedStaffId || updateHod.isPending}
                onClick={saveAssignment}
              >
                <MaterialSymbol icon="save" className="text-[18px]" />
                {updateHod.isPending ? "Saving…" : "Save Assignment"}
              </Button>
              <DialogFooter className="sm:justify-start">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => setAssignmentOpen(false)}
                  disabled={updateHod.isPending}
                >
                  Cancel
                </Button>
              </DialogFooter>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}
