"use client";

import * as React from "react";

import { MaterialSymbol } from "@/components/common/MaterialSymbol";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { getApiErrorLabel } from "@/lib/api-client-error";
import { getDayOfWeekName } from "@/lib/utils";
import { useLecturerCourses } from "@/services/lecturer/courses/courses";

import type { LecturerAssignedCourse } from "@/app/api/lecturer/courses/route";

function CourseCard({
  row,
  onOpen,
}: {
  row: LecturerAssignedCourse;
  onOpen: (row: LecturerAssignedCourse) => void;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-primary/10 px-2 py-1 text-[11px] font-semibold text-primary">
              {row.courseCode}
            </span>
            <span className="text-[11px] text-muted-foreground">
              {row.credits} credits
            </span>
            <span className="text-[11px] text-muted-foreground">
              {row.sessionName} • {row.semesterName}
            </span>
          </div>
          <p className="mt-3 text-base font-semibold truncate">
            {row.courseTitle}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {row.departmentName} • {row.enrolledCount} students
          </p>
        </div>

        <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-muted/40">
          <MaterialSymbol
            icon="menu_book"
            className="text-[20px] text-muted-foreground"
          />
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">
          Semester {row.courseSemesterNumber}
          {row.level != null ? ` • Level ${row.level}` : ""}
        </p>
        <Button variant="outline" size="sm" onClick={() => onOpen(row)}>
          Course details
        </Button>
      </div>
    </div>
  );
}

function CourseDetailsDialog({
  open,
  onOpenChange,
  row,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  row: LecturerAssignedCourse | null;
}) {
  if (!row) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {row.courseCode}: {row.courseTitle}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-border bg-muted/20 p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Session
              </p>
              <p className="mt-1 text-sm font-semibold">{row.sessionName}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {row.semesterName}
              </p>
            </div>
            <div className="rounded-xl border border-border bg-muted/20 p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Enrollment
              </p>
              <p className="mt-1 text-sm font-semibold">
                {row.enrolledCount} students
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {row.credits} credits
              </p>
            </div>
            <div className="rounded-xl border border-border bg-muted/20 p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Department
              </p>
              <p className="mt-1 text-sm font-semibold">{row.departmentName}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Semester {row.courseSemesterNumber}
              </p>
            </div>
            <div className="rounded-xl border border-border bg-muted/20 p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Level
              </p>
              <p className="mt-1 text-sm font-semibold">
                {row.level != null ? `Level ${row.level}` : "-"}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">Course info</p>
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold">Description</p>
            <p className="mt-1 text-sm text-muted-foreground whitespace-pre-line">
              {row.courseDescription || "No description provided."}
            </p>
          </div>

          <div>
            <p className="text-sm font-semibold">Timetable</p>
            <div className="mt-3">
              {row.timetable.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border p-6 text-sm text-muted-foreground">
                  No timetable entries yet.
                </div>
              ) : (
                <ul className="space-y-2">
                  {row.timetable.map((t) => (
                    <li
                      key={t.id}
                      className="rounded-xl border border-border bg-background px-4 py-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold">
                            {getDayOfWeekName(t.dayOfWeek)}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {t.location}
                          </p>
                        </div>
                        <p className="text-xs font-semibold text-muted-foreground whitespace-nowrap">
                          {t.startTime} - {t.endTime}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function LecturerCoursesPage() {
  const query = useLecturerCourses();
  const errorLabel = query.error ? getApiErrorLabel(query.error) : null;

  const [selected, setSelected] = React.useState<LecturerAssignedCourse | null>(
    null,
  );

  const rows = query.data?.rows ?? [];

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Lecturer Portal
        </p>
        <h1 className="font-lexend text-2xl font-semibold tracking-tight">
          My Courses
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Courses assigned to you, with quick details.
        </p>
      </header>

      {errorLabel ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4">
          <p className="text-sm font-semibold">Failed to load courses</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {errorLabel.code
              ? `${errorLabel.message} (${errorLabel.code})`
              : errorLabel.message}
          </p>
        </div>
      ) : null}

      {query.isPending ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Skeleton className="h-44 w-full rounded-2xl" />
          <Skeleton className="h-44 w-full rounded-2xl" />
          <Skeleton className="h-44 w-full rounded-2xl" />
          <Skeleton className="h-44 w-full rounded-2xl" />
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-10 text-center">
          <p className="text-sm font-semibold">No courses assigned yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Your assigned courses will appear here once set by your department.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {rows.map((row) => (
            <CourseCard key={row.assignmentId} row={row} onOpen={setSelected} />
          ))}
        </div>
      )}

      <CourseDetailsDialog
        open={Boolean(selected)}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
        row={selected}
      />
    </div>
  );
}
