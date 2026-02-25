"use client";

import * as React from "react";
import type { DragFromOutsideItemArgs } from "react-big-calendar/lib/addons/dragAndDrop";
import { dateFnsLocalizer } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { enUS } from "date-fns/locale";

import BigCalendarDnD, {
  type BigCalendarEvent,
} from "@/components/common/react-big-calendar/big-calendar-dnd";
import { MaterialSymbol } from "@/components/common/MaterialSymbol";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getApiErrorLabel } from "@/lib/api-client-error";
import { useLecturerCourses } from "@/services/lecturer/courses/courses";
import {
  useCreateExam,
  useCreateClass,
  useLecturerSchedule,
  useUpdateScheduleEvent,
} from "@/services/lecturer/schedule/schedule";

import {
  ScheduleTabs,
  type ScheduleTabKey,
} from "@/components/lecturer/schedule/ScheduleTabs";
import { UnscheduledCoursesPanel } from "@/components/lecturer/schedule/UnscheduledCoursesPanel";
import { VenueSelect } from "@/components/lecturer/schedule/VenueSelect";
import {
  AutomationToolCard,
  VenueAvailabilityCard,
} from "@/components/lecturer/schedule/SideCards";
import {
  ExamCoordinatorCard,
  type ExamCourseOption,
} from "@/components/lecturer/schedule/ExamCoordinatorCard";
import { VENUE_OPTIONS } from "@/lib/venues";

import type { LecturerAssignedCourse } from "@/app/api/lecturer/courses/route";

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

function formatHHmm(date: Date): string {
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

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
  const createClassMutation = useCreateClass();
  const coursesQuery = useLecturerCourses();

  const [tab, setTab] = React.useState<ScheduleTabKey>("TIMETABLE");
  const [localError, setLocalError] = React.useState<string | null>(null);
  const [selectedVenue, setSelectedVenue] = React.useState(
    VENUE_OPTIONS[0] ?? "",
  );

  const [draggingCourse, setDraggingCourse] =
    React.useState<LecturerAssignedCourse | null>(null);

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

  const assignedCourses = coursesQuery.data?.rows ?? [];

  const examCourseOptions: ExamCourseOption[] = React.useMemo(
    () =>
      assignedCourses.map((c) => ({
        offeringId: c.offeringId,
        courseCode: c.courseCode,
        courseTitle: c.courseTitle,
      })),
    [assignedCourses],
  );

  const periodLabel = React.useMemo(() => {
    const first = assignedCourses[0];
    if (!first) return null;
    return `${first.semesterName} • ${first.sessionName}`;
  }, [assignedCourses]);

  const venueAvailability = React.useMemo(() => {
    const used = new Set(
      (scheduleQuery.data?.rows ?? [])
        .map((r) => r.location)
        .filter(
          (v): v is string => typeof v === "string" && v.trim().length > 0,
        ),
    );

    const shortlist = ["ROB Room 1", "NLB Room 1", "NFB Room 1", "JCRC Room 1"];
    return shortlist.map((name) => ({
      name,
      status: used.has(name) ? ("Booked" as const) : ("Free" as const),
    }));
  }, [scheduleQuery.data]);

  const coerceDate = React.useCallback((value: Date | string) => {
    if (value instanceof Date) return value;
    return new Date(value);
  }, []);

  const handleDropFromOutside = React.useCallback(
    async (args: DragFromOutsideItemArgs) => {
      if (!draggingCourse) return;
      if (!selectedVenue) {
        setLocalError("Please select a venue before scheduling.");
        return;
      }

      setLocalError(null);

      const start = coerceDate(args.start);
      const endCandidate = coerceDate(args.end);
      const end =
        endCandidate.getTime() > start.getTime()
          ? endCandidate
          : new Date(start.getTime() + 60 * 60 * 1000);
      const startTime = formatHHmm(start);
      const endTime = formatHHmm(end);

      try {
        await createClassMutation.mutateAsync({
          kind: "CLASS",
          offeringId: draggingCourse.offeringId,
          dayOfWeek: start.getDay(),
          startTime,
          endTime,
          location: selectedVenue,
        });
      } catch (error) {
        const label = getApiErrorLabel(error);
        setLocalError(
          label.code ? `${label.message} (${label.code})` : label.message,
        );
      } finally {
        setDraggingCourse(null);
      }
    },
    [coerceDate, createClassMutation, draggingCourse, selectedVenue],
  );

  const onDropFromOutside = React.useCallback(
    (args: DragFromOutsideItemArgs) => {
      void handleDropFromOutside(args);
    },
    [handleDropFromOutside],
  );

  const dragFromOutsideItem = React.useCallback((): ScheduleCalendarEvent => {
    const now = new Date();

    if (!draggingCourse) {
      return {
        id: "DRAG:NONE",
        title: "",
        start: now,
        end: new Date(now.getTime() + 60 * 60 * 1000),
        allDay: false,
        resource: {
          kind: "CLASS" as const,
          entityId: "",
          offeringId: "",
          courseCode: "",
          courseTitle: "",
          location: selectedVenue || null,
          examType: null,
        } satisfies ScheduleResource,
      } satisfies ScheduleCalendarEvent;
    }

    return {
      id: `DRAG:${draggingCourse.offeringId}`,
      title: `${draggingCourse.courseCode} Class`,
      start: now,
      end: new Date(now.getTime() + 60 * 60 * 1000),
      allDay: false,
      resource: {
        kind: "CLASS" as const,
        entityId: "",
        offeringId: draggingCourse.offeringId,
        courseCode: draggingCourse.courseCode,
        courseTitle: draggingCourse.courseTitle,
        location: selectedVenue || null,
        examType: null,
      } satisfies ScheduleResource,
    } satisfies ScheduleCalendarEvent;
  }, [draggingCourse, selectedVenue]);

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Academic Management
          </p>
          <h1 className="font-lexend text-2xl font-semibold tracking-tight">
            Academic Schedule Configuration
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Plan classes and exams. Students receive notifications when items
            change.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" disabled>
            Filter
          </Button>
          <Button
            type="button"
            onClick={() => scheduleQuery.refetch()}
            disabled={scheduleQuery.isPending}
          >
            Publish Changes
          </Button>
        </div>
      </header>

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
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold">Schedule Config</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {periodLabel ?? ""}
            </p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-muted/40">
            <MaterialSymbol
              icon="calendar_month"
              className="text-[20px] text-muted-foreground"
            />
          </div>
        </div>

        <div className="mt-5">
          <ScheduleTabs value={tab} onChange={setTab} />

          {localError ? (
            <div className="mt-4 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              {localError}
            </div>
          ) : null}

          {tab === "TIMETABLE" ? (
            <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12">
              <div className="space-y-6 lg:col-span-4">
                <div className="rounded-2xl border border-border bg-card p-4">
                  <p className="text-sm font-semibold">Placement venue</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Select a venue, then drag a course.
                  </p>
                  <div className="mt-3">
                    <VenueSelect
                      value={selectedVenue}
                      onChange={setSelectedVenue}
                      placeholder="Select venue"
                      disabled={VENUE_OPTIONS.length === 0}
                    />
                  </div>
                </div>

                <UnscheduledCoursesPanel
                  courses={assignedCourses}
                  draggingOfferingId={draggingCourse?.offeringId ?? null}
                  onDragStart={(c) => setDraggingCourse(c)}
                  onDragEnd={() => setDraggingCourse(null)}
                />

                <VenueAvailabilityCard items={venueAvailability} />

                <AutomationToolCard onRun={() => scheduleQuery.refetch()} />
              </div>

              <div className="lg:col-span-8">
                {scheduleQuery.isPending ? (
                  <Skeleton className="h-170 w-full rounded-2xl" />
                ) : (
                  <BigCalendarDnD
                    localizer={localizer}
                    events={events}
                    defaultView="work_week"
                    views={["work_week", "day"]}
                    popup
                    resizable
                    step={30}
                    timeslots={2}
                    onEventDrop={onEventDrop}
                    onEventResize={onEventResize}
                    onDropFromOutside={onDropFromOutside}
                    dragFromOutsideItem={
                      draggingCourse ? dragFromOutsideItem : undefined
                    }
                    className="h-170"
                  />
                )}

                {updateMutation.isPending || createClassMutation.isPending ? (
                  <p className="mt-3 text-sm text-muted-foreground">
                    Saving changes...
                  </p>
                ) : null}
              </div>
            </div>
          ) : null}

          {tab === "EXAMS" ? (
            <div className="mt-6">
              <ExamCoordinatorCard
                courses={examCourseOptions}
                coursesPending={coursesQuery.isPending}
                isSaving={createExamMutation.isPending}
                onCreate={async (input) => {
                  await createExamMutation.mutateAsync({
                    kind: "EXAM",
                    offeringId: input.offeringId,
                    examType: input.examType,
                    examDate: input.examDate.toISOString(),
                    startTime: input.startTime,
                    endTime: input.endTime,
                    location: input.location,
                  });
                }}
              />
            </div>
          ) : null}

          {tab === "LOAD" ? (
            <div className="mt-6 rounded-2xl border border-border bg-background p-6 text-sm text-muted-foreground">
              Staff load balancing is coming soon.
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
