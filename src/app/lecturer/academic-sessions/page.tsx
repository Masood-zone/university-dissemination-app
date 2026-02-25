"use client";

import Link from "next/link";
import * as React from "react";
import { dateFnsLocalizer } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { enUS } from "date-fns/locale";

import BigCalendarDnD, {
  type BigCalendarEvent,
} from "@/components/common/react-big-calendar/big-calendar-dnd";
import { MaterialSymbol } from "@/components/common/MaterialSymbol";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { getApiErrorLabel } from "@/lib/api-client-error";
import { useLecturerCourses } from "@/services/lecturer/courses/courses";
import {
  useCreateExam,
  useLecturerSchedule,
  useUpdateScheduleEvent,
} from "@/services/lecturer/schedule/schedule";

type ScheduleResource = {
  kind: "CLASS" | "EXAM";
  entityId: string;
  offeringId: string;
  courseCode: string;
  courseTitle: string;
  location: string | null;
  examType: string | null;
};

type ScheduleCalendarEvent = BigCalendarEvent & {
  resource: ScheduleResource;
};

const locales = {
  "en-US": enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 0 }),
  getDay,
  locales,
});

function toEventTitle(row: {
  kind: "CLASS" | "EXAM";
  courseCode: string;
  courseTitle: string;
  examType?: string | null;
}) {
  if (row.kind === "EXAM") {
    const label = row.examType ? row.examType : "Exam";
    return `${row.courseCode} ${label}`;
  }

  return `${row.courseCode} Class`;
}

export default function LecturerAcademicSessionsPage() {
  const scheduleQuery = useLecturerSchedule();
  const updateMutation = useUpdateScheduleEvent();
  const createExamMutation = useCreateExam();
  const coursesQuery = useLecturerCourses();

  const [localError, setLocalError] = React.useState<string | null>(null);

  const [examOfferingId, setExamOfferingId] = React.useState("");
  const [examType, setExamType] = React.useState("MIDSEM");
  const [examDate, setExamDate] = React.useState<Date | undefined>(undefined);
  const [startTime, setStartTime] = React.useState("09:00");
  const [endTime, setEndTime] = React.useState("10:00");
  const [location, setLocation] = React.useState("");

  const apiError = scheduleQuery.error
    ? getApiErrorLabel(scheduleQuery.error)
    : null;

  const events: ScheduleCalendarEvent[] = React.useMemo(() => {
    const rows = scheduleQuery.data?.rows ?? [];

    return rows.flatMap((row) => {
      const start = new Date(row.start);
      const end = new Date(row.end);

      if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
        return [];
      }

      const event = {
        id: row.id,
        title: toEventTitle(row),
        start,
        end,
        allDay: row.allDay ?? false,
        resource: {
          kind: row.kind,
          entityId: row.entityId,
          offeringId: row.offeringId,
          courseCode: row.courseCode,
          courseTitle: row.courseTitle,
          location: row.location,
          examType: row.examType ?? null,
        },
      } satisfies ScheduleCalendarEvent;

      return [event];
    });
  }, [scheduleQuery.data]);

  const onEventDrop = async (args: {
    event: object;
    start: string | Date;
    end: string | Date;
  }) => {
    const event = args.event as Partial<ScheduleCalendarEvent>;
    const resource = event.resource;

    if (!resource) return;

    const startDate =
      typeof args.start === "string" ? new Date(args.start) : args.start;
    const endDate =
      typeof args.end === "string" ? new Date(args.end) : args.end;

    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      return;
    }

    setLocalError(null);

    try {
      await updateMutation.mutateAsync({
        kind: resource.kind,
        id: resource.entityId,
        start: startDate.toISOString(),
        end: endDate.toISOString(),
      });
    } catch (error) {
      const label = getApiErrorLabel(error);
      setLocalError(
        label.code ? `${label.message} (${label.code})` : label.message,
      );
    }
  };

  const onEventResize = async (args: {
    event: object;
    start: string | Date;
    end: string | Date;
  }) => {
    const event = args.event as Partial<ScheduleCalendarEvent>;
    const resource = event.resource;

    if (!resource) return;

    const startDate =
      typeof args.start === "string" ? new Date(args.start) : args.start;
    const endDate =
      typeof args.end === "string" ? new Date(args.end) : args.end;

    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      return;
    }

    setLocalError(null);

    try {
      await updateMutation.mutateAsync({
        kind: resource.kind,
        id: resource.entityId,
        start: startDate.toISOString(),
        end: endDate.toISOString(),
      });
    } catch (error) {
      const label = getApiErrorLabel(error);
      setLocalError(
        label.code ? `${label.message} (${label.code})` : label.message,
      );
    }
  };

  const submitExam = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    if (!examOfferingId) {
      setLocalError("Please choose a course offering");
      return;
    }

    if (!examType.trim()) {
      setLocalError("Exam type is required");
      return;
    }

    if (!examDate) {
      setLocalError("Exam date is required");
      return;
    }

    if (!startTime.trim() || !endTime.trim()) {
      setLocalError("Start and end time are required");
      return;
    }

    if (!location.trim()) {
      setLocalError("Location is required");
      return;
    }

    try {
      await createExamMutation.mutateAsync({
        offeringId: examOfferingId,
        examType: examType.trim(),
        examDate: examDate.toISOString(),
        startTime: startTime.trim(),
        endTime: endTime.trim(),
        location: location.trim(),
      });

      setExamOfferingId("");
      setExamType("MIDSEM");
      setExamDate(undefined);
      setStartTime("09:00");
      setEndTime("10:00");
      setLocation("");
    } catch (error) {
      const label = getApiErrorLabel(error);
      setLocalError(
        label.code ? `${label.message} (${label.code})` : label.message,
      );
    }
  };

  const courseOptions = coursesQuery.data?.rows ?? [];

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Lecturer Portal
          </p>
          <h1 className="font-lexend text-2xl font-semibold tracking-tight">
            Academic Sessions
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Schedule classes and exams. Students receive notifications when
            items change.
          </p>
        </div>

        <Button asChild variant="ghost">
          <Link href="/lecturer">Back to overview</Link>
        </Button>
      </header>

      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold">Set midsem / exam date</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Add an exam to the calendar and notify enrolled students.
            </p>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-muted/40">
            <MaterialSymbol
              icon="event"
              className="text-[20px] text-muted-foreground"
            />
          </div>
        </div>

        <form onSubmit={submitExam} className="mt-5 space-y-4">
          {localError ? (
            <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              {localError}
            </div>
          ) : null}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
            <div className="md:col-span-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Course
              </label>
              <div className="mt-2">
                {coursesQuery.isPending ? (
                  <Skeleton className="h-10 w-full rounded-xl" />
                ) : (
                  <Select
                    value={examOfferingId}
                    onChange={(e) => setExamOfferingId(e.target.value)}
                  >
                    <option value="">Select course</option>
                    {courseOptions.map((c) => (
                      <option key={c.offeringId} value={c.offeringId}>
                        {c.courseCode} — {c.courseTitle}
                      </option>
                    ))}
                  </Select>
                )}
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Type
              </label>
              <div className="mt-2">
                <Select
                  value={examType}
                  onChange={(e) => setExamType(e.target.value)}
                >
                  <option value="MIDSEM">Midsem</option>
                  <option value="EXAM">Exam</option>
                </Select>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Date
              </label>
              <div className="mt-2">
                <DatePicker value={examDate} onChange={setExamDate} />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Time
              </label>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm"
                />
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Location
            </label>
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="mt-2 h-10 w-full rounded-xl border border-input bg-background px-3 text-sm"
              placeholder="e.g., Lecture Hall 2"
            />
          </div>

          <div className="flex items-center justify-end gap-2">
            <Button type="submit" disabled={createExamMutation.isPending}>
              {createExamMutation.isPending ? "Saving..." : "Add to calendar"}
            </Button>
          </div>
        </form>
      </div>

      {apiError ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4">
          <p className="text-sm font-semibold">Failed to load schedule</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {apiError.code
              ? `${apiError.message} (${apiError.code})`
              : apiError.message}
          </p>
        </div>
      ) : null}

      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold">Class schedule</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Drag and drop classes or exams to reschedule. Changes are saved
              immediately.
            </p>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-muted/40">
            <MaterialSymbol
              icon="calendar_month"
              className="text-[20px] text-muted-foreground"
            />
          </div>
        </div>

        <div className="mt-5">
          {scheduleQuery.isPending ? (
            <Skeleton className="h-170 w-full rounded-2xl" />
          ) : (
            <BigCalendarDnD
              localizer={localizer}
              events={events}
              defaultView="week"
              popup
              resizable
              onEventDrop={onEventDrop}
              onEventResize={onEventResize}
              className="h-170"
            />
          )}

          {updateMutation.isPending ? (
            <p className="mt-3 text-sm text-muted-foreground">
              Saving changes...
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
