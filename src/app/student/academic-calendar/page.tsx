"use client";

import * as React from "react";

import { MaterialSymbol } from "@/components/common/MaterialSymbol";
import { Skeleton } from "@/components/ui/skeleton";
import { getApiErrorLabel } from "@/lib/api-client-error";
import { cn, getDayOfWeekName } from "@/lib/utils";
import { useGetEnrollmentStatus } from "@/services/enrollment/enrollment";
import { useStudentAcademicCalendarWeek } from "@/services/student/academic-calendar/academic-calendar";
import type { StudentAcademicCalendarEvent } from "@/types";

function toMinutes(hhmm: string): number | null {
  const m = /^([01]?\d|2[0-3]):([0-5]\d)$/.exec(hhmm.trim());
  if (!m) return null;
  return Number(m[1]) * 60 + Number(m[2]);
}

function formatTimeOfDay(minutes: number): string {
  const h24 = Math.floor(minutes / 60) % 24;
  const mm = String(minutes % 60).padStart(2, "0");
  const h12 = ((h24 + 11) % 12) + 1;
  const suffix = h24 >= 12 ? "PM" : "AM";
  return `${String(h12).padStart(2, "0")}:${mm} ${suffix}`;
}

function formatDateRange(weekStartIso: string, weekEndIso: string): string {
  const start = new Date(weekStartIso);
  const endExclusive = new Date(weekEndIso);
  if (Number.isNaN(start.getTime()) || Number.isNaN(endExclusive.getTime())) {
    return "This week";
  }
  const end = new Date(endExclusive);
  end.setDate(end.getDate() - 1);
  const fmt = new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  return `${fmt.format(start)} – ${fmt.format(end)}`;
}

function formatDayHeader(weekStartIso: string, dayOfWeek: number): string {
  const weekStart = new Date(weekStartIso);
  if (Number.isNaN(weekStart.getTime())) return getDayOfWeekName(dayOfWeek);

  // weekStart is Monday (dayOfWeek=1)
  const offset = (dayOfWeek - 1 + 7) % 7;
  const d = new Date(weekStart);
  d.setDate(d.getDate() + offset);
  const fmt = new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
  });
  return `${getDayOfWeekName(dayOfWeek)} (${fmt.format(d)})`;
}

function computeTimeSlots(events: StudentAcademicCalendarEvent[]): number[] {
  const mins = events
    .flatMap((e) => {
      const s = toMinutes(e.startTime);
      const t = toMinutes(e.endTime);
      return [s, t];
    })
    .filter((v): v is number => typeof v === "number" && Number.isFinite(v));

  const defaultSlots = Array.from({ length: 11 }).map((_, i) => (8 + i) * 60); // 08:00-18:00
  if (!mins.length) return defaultSlots;

  const min = Math.min(...mins);
  const max = Math.max(...mins);
  const start = Math.floor(min / 60) * 60;
  const end = Math.ceil(max / 60) * 60;
  const slots: number[] = [];
  for (let t = start; t <= end; t += 60) slots.push(t);
  return slots.length >= 2 ? slots : defaultSlots;
}

export default function StudentAcademicCalendarPage() {
  const enrollment = useGetEnrollmentStatus();
  const isApproved = enrollment.data?.status === "APPROVED";

  const calendar = useStudentAcademicCalendarWeek(isApproved);

  const weekLabel = calendar.data
    ? formatDateRange(calendar.data.weekStart, calendar.data.weekEnd)
    : "This week";

  const days = React.useMemo(() => [1, 2, 3, 4, 5], []); // Mon-Fri
  const timeSlots = React.useMemo(
    () => computeTimeSlots(calendar.data?.events ?? []),
    [calendar.data?.events],
  );

  const eventsByDay = React.useMemo(() => {
    const map = new Map<number, StudentAcademicCalendarEvent[]>();
    for (const d of days) map.set(d, []);
    for (const e of calendar.data?.events ?? []) {
      if (!map.has(e.dayOfWeek)) continue;
      map.get(e.dayOfWeek)?.push(e);
    }
    for (const [d, list] of map) {
      list.sort(
        (a, b) => (toMinutes(a.startTime) ?? 0) - (toMinutes(b.startTime) ?? 0),
      );
      map.set(d, list);
    }
    return map;
  }, [calendar.data?.events, days]);

  return (
    <section className="space-y-6">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-xl font-semibold">
            Academic Calendar
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Weekly class schedule based on your enrolled courses.
          </p>
        </div>

        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-semibold text-muted-foreground">
          <MaterialSymbol icon="calendar_today" className="text-[16px]" />
          {weekLabel}
        </div>
      </header>

      {!isApproved && !enrollment.isLoading ? (
        <div className="rounded-2xl border border-border bg-card p-6">
          <p className="text-sm font-semibold">Access restricted</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Your schedule unlocks after enrollment approval.
          </p>
        </div>
      ) : null}

      {calendar.isError ? (
        <div className="rounded-2xl border border-border bg-card p-6">
          <p className="text-sm font-semibold">Failed to load schedule</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {getApiErrorLabel(calendar.error).message}
          </p>
        </div>
      ) : null}

      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="grid grid-cols-6 border-b border-border bg-muted/30">
          <div className="p-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Time
          </div>
          {days.map((d) => (
            <div
              key={d}
              className="p-3 text-xs font-semibold border-l border-border"
            >
              {calendar.data
                ? formatDayHeader(calendar.data.weekStart, d)
                : getDayOfWeekName(d)}
            </div>
          ))}
        </div>

        {calendar.isLoading ? (
          <div className="p-4">
            <Skeleton className="h-[420px] w-full rounded-xl" />
          </div>
        ) : (
          <div className="divide-y divide-border">
            {timeSlots.map((t) => (
              <div key={t} className="grid grid-cols-6">
                <div className="p-3 text-[11px] font-semibold text-muted-foreground">
                  {formatTimeOfDay(t)}
                </div>
                {days.map((d) => {
                  const slotStart = t;
                  const slotEnd = t + 60;
                  const events = (eventsByDay.get(d) ?? []).filter((e) => {
                    const start = toMinutes(e.startTime);
                    if (start === null) return false;
                    return start >= slotStart && start < slotEnd;
                  });

                  return (
                    <div
                      key={d}
                      className="min-h-[84px] border-l border-border p-2"
                    >
                      {events.length === 0 ? null : (
                        <div className="space-y-2">
                          {events.map((e) => (
                            <div
                              key={e.id}
                              className={cn(
                                "rounded-xl border border-border bg-muted/30 p-3",
                              )}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                  <p className="text-xs font-semibold truncate">
                                    {e.courseCode}
                                  </p>
                                  <p className="text-[11px] text-muted-foreground truncate">
                                    {e.courseTitle}
                                  </p>
                                </div>
                                <span className="rounded-full border border-border bg-card px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                                  {e.startTime}–{e.endTime}
                                </span>
                              </div>
                              <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                                <span className="inline-flex items-center gap-1">
                                  <MaterialSymbol
                                    icon="location_on"
                                    className="text-[14px]"
                                  />
                                  {e.location}
                                </span>
                                {e.lecturer ? (
                                  <span className="inline-flex items-center gap-1">
                                    <MaterialSymbol
                                      icon="person"
                                      className="text-[14px]"
                                    />
                                    {e.lecturer}
                                  </span>
                                ) : null}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
