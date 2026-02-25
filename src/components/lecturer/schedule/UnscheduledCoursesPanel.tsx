"use client";

import * as React from "react";

import { MaterialSymbol } from "@/components/common/MaterialSymbol";
import { cn } from "@/lib/utils";

import type { LecturerAssignedCourse } from "@/app/api/lecturer/courses/route";

export function UnscheduledCoursesPanel({
  courses,
  draggingOfferingId,
  onDragStart,
  onDragEnd,
}: {
  courses: LecturerAssignedCourse[];
  draggingOfferingId: string | null;
  onDragStart: (course: LecturerAssignedCourse) => void;
  onDragEnd: () => void;
}) {
  const unscheduled = courses.filter((c) => (c.timetable ?? []).length === 0);

  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Unscheduled Courses
      </p>

      <div className="mt-3 space-y-3">
        {unscheduled.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
            All assigned courses have timetable entries.
          </div>
        ) : (
          unscheduled.map((c) => (
            <div
              key={c.offeringId}
              draggable
              onDragStart={() => onDragStart(c)}
              onDragEnd={onDragEnd}
              className={cn(
                "rounded-xl border border-border bg-background p-3 cursor-grab active:cursor-grabbing",
                draggingOfferingId === c.offeringId && "opacity-60",
              )}
              title="Drag to the calendar to schedule"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate">
                    {c.courseCode} — {c.courseTitle}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {c.enrolledCount} students
                  </p>
                </div>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted/40">
                  <MaterialSymbol
                    icon="drag_indicator"
                    className="text-[18px] text-muted-foreground"
                  />
                </div>
              </div>
            </div>
          ))
        )}

        <div className="rounded-xl border border-dashed border-border p-4 text-xs text-muted-foreground">
          Drag course offerings from here to the calendar grid.
        </div>
      </div>
    </div>
  );
}
