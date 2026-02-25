"use client";

import * as React from "react";

import { MaterialSymbol } from "@/components/common/MaterialSymbol";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { getApiErrorLabel } from "@/lib/api-client-error";

import { VenueSelect } from "@/components/lecturer/schedule/VenueSelect";

export type ExamCourseOption = {
  offeringId: string;
  courseCode: string;
  courseTitle: string;
};

export function ExamCoordinatorCard({
  courses,
  coursesPending,
  onCreate,
  isSaving,
}: {
  courses: ExamCourseOption[];
  coursesPending: boolean;
  onCreate: (input: {
    offeringId: string;
    examType: string;
    examDate: Date;
    startTime: string;
    endTime: string;
    location: string;
  }) => Promise<void>;
  isSaving: boolean;
}) {
  const [localError, setLocalError] = React.useState<string | null>(null);

  const [examOfferingId, setExamOfferingId] = React.useState("");
  const [examType, setExamType] = React.useState("MIDSEM");
  const [examDate, setExamDate] = React.useState<Date | undefined>(undefined);
  const [startTime, setStartTime] = React.useState("09:00");
  const [endTime, setEndTime] = React.useState("10:00");
  const [location, setLocation] = React.useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLocalError(null);

    if (!examOfferingId) return setLocalError("Please choose a course");
    if (!examDate) return setLocalError("Exam date is required");
    if (!startTime.trim() || !endTime.trim())
      return setLocalError("Start and end time are required");
    if (!location.trim()) return setLocalError("Venue is required");

    try {
      await onCreate({
        offeringId: examOfferingId,
        examType: examType.trim(),
        examDate,
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
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold">Exam coordination</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Schedule midsem/exams and notify enrolled students.
          </p>
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-muted/40">
          <MaterialSymbol
            icon="event"
            className="text-[20px] text-muted-foreground"
          />
        </div>
      </div>

      <form onSubmit={submit} className="mt-5 space-y-4">
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
              {coursesPending ? (
                <Skeleton className="h-10 w-full rounded-xl" />
              ) : (
                <Select
                  value={examOfferingId ? examOfferingId : "__none"}
                  onValueChange={(v) =>
                    setExamOfferingId(v === "__none" ? "" : v)
                  }
                >
                  <SelectTrigger className="w-full" aria-label="Course">
                    <SelectValue placeholder="Select course" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none">Select course</SelectItem>
                    {courses.map((c) => (
                      <SelectItem key={c.offeringId} value={c.offeringId}>
                        {c.courseCode} — {c.courseTitle}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Type
            </label>
            <div className="mt-2">
              <Select value={examType} onValueChange={setExamType}>
                <SelectTrigger className="w-full" aria-label="Exam type">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MIDSEM">Midsem</SelectItem>
                  <SelectItem value="EXAM">Exam</SelectItem>
                </SelectContent>
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
            Venue
          </label>
          <div className="mt-2">
            <VenueSelect value={location} onChange={setLocation} />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2">
          <Button type="submit" disabled={isSaving}>
            {isSaving ? "Saving..." : "Add to calendar"}
          </Button>
        </div>
      </form>
    </div>
  );
}
