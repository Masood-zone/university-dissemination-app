"use client";

import * as React from "react";

import { MaterialSymbol } from "@/components/common/MaterialSymbol";
import { Skeleton } from "@/components/ui/skeleton";
import { getApiErrorLabel } from "@/lib/api-client-error";
import { getDayOfWeekName } from "@/lib/utils";
import { useGetEnrollmentStatus } from "@/services/enrollment/enrollment";
import { useStudentCourseOfferings } from "@/services/student/course-offerings/course-offerings";
import type { StudentCourseOfferingRow } from "@/types";

function formatScheduleLine(t: StudentCourseOfferingRow["timetable"][number]) {
  return `${getDayOfWeekName(t.dayOfWeek)} ${t.startTime}–${t.endTime} • ${t.location}`;
}

export default function StudentCourseOfferingsPage() {
  const enrollment = useGetEnrollmentStatus();
  const isApproved = enrollment.data?.status === "APPROVED";

  const offerings = useStudentCourseOfferings(isApproved);

  const sessionName = offerings.data?.sessionName ?? null;
  const semesterName = offerings.data?.semesterName ?? null;
  const rows = offerings.data?.rows ?? [];

  const totalCredits = React.useMemo(
    () => rows.reduce((sum, r) => sum + (r.credits ?? 0), 0),
    [rows],
  );

  return (
    <section className="space-y-6">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-xl font-semibold">
            Course Offerings
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Courses you are currently enrolled in.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {sessionName && semesterName ? (
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-semibold text-muted-foreground">
              <MaterialSymbol icon="school" className="text-[16px]" />
              {semesterName} • {sessionName}
            </div>
          ) : null}
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-semibold text-muted-foreground">
            <MaterialSymbol icon="menu_book" className="text-[16px]" />
            {offerings.isLoading
              ? "Loading…"
              : `${rows.length} courses • ${totalCredits} credits`}
          </div>
        </div>
      </header>

      {!isApproved && !enrollment.isLoading ? (
        <div className="rounded-2xl border border-border bg-card p-6">
          <p className="text-sm font-semibold">Access restricted</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Your course list unlocks after enrollment approval.
          </p>
        </div>
      ) : null}

      {offerings.isError ? (
        <div className="rounded-2xl border border-border bg-card p-6">
          <p className="text-sm font-semibold">Failed to load courses</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {getApiErrorLabel(offerings.error).message}
          </p>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {offerings.isLoading
          ? Array.from({ length: 4 }).map((_, idx) => (
              <div
                key={idx}
                className="rounded-2xl border border-border bg-card p-6"
              >
                <Skeleton className="h-4 w-24" />
                <Skeleton className="mt-3 h-6 w-3/4" />
                <Skeleton className="mt-4 h-16 w-full" />
              </div>
            ))
          : rows.map((row) => (
              <div
                key={row.offeringId}
                className="rounded-2xl border border-border bg-card p-6"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      {row.courseCode}
                    </p>
                    <h2 className="mt-1 font-display text-lg font-semibold truncate">
                      {row.courseTitle}
                    </h2>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {row.credits} credits
                      {row.level ? ` • Level ${row.level}` : ""}
                      {row.departmentName ? ` • ${row.departmentName}` : ""}
                    </p>
                  </div>

                  <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-muted/40">
                    <MaterialSymbol
                      icon="menu_book"
                      className="text-[20px] text-muted-foreground"
                    />
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground">
                    Lecturer(s)
                  </p>
                  <p className="text-sm">
                    {row.lecturers.length
                      ? row.lecturers.map((l) => l.name).join(", ")
                      : "—"}
                  </p>
                </div>

                <div className="mt-4 space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground">
                    Schedule
                  </p>
                  {row.timetable.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No classes scheduled yet.
                    </p>
                  ) : (
                    <ul className="space-y-1">
                      {row.timetable.slice(0, 3).map((t) => (
                        <li
                          key={t.id}
                          className="text-sm text-muted-foreground"
                        >
                          {formatScheduleLine(t)}
                        </li>
                      ))}
                      {row.timetable.length > 3 ? (
                        <li className="text-xs font-semibold text-muted-foreground">
                          +{row.timetable.length - 3} more
                        </li>
                      ) : null}
                    </ul>
                  )}
                </div>
              </div>
            ))}
      </div>

      {!offerings.isLoading && rows.length === 0 && isApproved ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
          <p className="text-sm font-semibold">No enrolled courses yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Once your programme offerings are configured for the current
            semester, they will appear here.
          </p>
        </div>
      ) : null}
    </section>
  );
}
