"use client";

import { useMemo, useRef, useState } from "react";

import { MaterialSymbol } from "@/components/common/MaterialSymbol";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  useDepartmentAdminCourseOfferings,
  useDepartmentAdminCourses,
  useDepartmentAdminCreateCourse,
  useDepartmentAdminDeleteCourse,
  useDepartmentAdminLecturers,
  useDepartmentAdminProgrammes,
  useDepartmentAdminSetOfferingLecturer,
  useDepartmentAdminUpdateCourse,
} from "@/services/department-admin/programmes-and-courses/programmes-and-courses";
import type { DepartmentAdminCourseOfferingView } from "@/types";
import { toast } from "sonner";

function percentTone(percent: number): "green" | "amber" | "red" {
  if (percent >= 90) return "red";
  if (percent >= 70) return "amber";
  return "green";
}

export default function DepartmentAdminProgrammesAndCoursesPage() {
  const [view, setView] =
    useState<DepartmentAdminCourseOfferingView>("CURRENT");

  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);
  const codeRef = useRef<HTMLInputElement | null>(null);

  const programmesQuery = useDepartmentAdminProgrammes();
  const lecturersQuery = useDepartmentAdminLecturers();
  const offeringsQuery = useDepartmentAdminCourseOfferings(view);

  const createCourse = useDepartmentAdminCreateCourse();
  const updateCourse = useDepartmentAdminUpdateCourse();
  const deleteCourse = useDepartmentAdminDeleteCourse();
  const setOfferingLecturer = useDepartmentAdminSetOfferingLecturer();

  const [programmeId, setProgrammeId] = useState<string>("");
  const [selectedCourseId, setSelectedCourseId] = useState<string>("");
  const [courseCode, setCourseCode] = useState<string>("");
  const [credits, setCredits] = useState<string>("3");
  const [courseTitle, setCourseTitle] = useState<string>("");
  const [semester, setSemester] = useState<string>("1");
  const [level, setLevel] = useState<string>("100");

  const coursesQuery = useDepartmentAdminCourses({
    programmeId: programmeId.trim() ? programmeId : undefined,
  });

  const lecturersById = useMemo(() => {
    const map = new Map<string, { loadPercent: number; loadCredits: number }>();
    for (const l of lecturersQuery.data ?? []) {
      map.set(l.id, { loadPercent: l.loadPercent, loadCredits: l.loadCredits });
    }
    return map;
  }, [lecturersQuery.data]);

  const averageLoad = useMemo(() => {
    const list = lecturersQuery.data ?? [];
    if (!list.length) return null;
    const avg =
      list.reduce((sum, l) => sum + (l.loadCredits ?? 0), 0) / list.length;
    return Math.round(avg * 10) / 10;
  }, [lecturersQuery.data]);

  async function handleSubmit() {
    const parsedCredits = Number(credits);
    const parsedSemester = Number(semester);
    const parsedLevel = level.trim() ? Number(level) : null;

    if (!courseCode.trim() || !courseTitle.trim()) {
      toast.error("Course code and title are required");
      return;
    }

    if (!Number.isFinite(parsedCredits) || parsedCredits <= 0) {
      toast.error("Credits must be a valid number");
      return;
    }

    if (![1, 2].includes(parsedSemester)) {
      toast.error("Semester must be 1 or 2");
      return;
    }

    if (parsedLevel !== null && !Number.isFinite(parsedLevel)) {
      toast.error("Level must be a valid number");
      return;
    }

    const payload = {
      programmeId: programmeId.trim() ? programmeId : null,
      code: courseCode.trim(),
      title: courseTitle.trim(),
      credits: parsedCredits,
      semester: parsedSemester,
      level: parsedLevel,
    };

    try {
      if (editingCourseId) {
        await updateCourse.mutateAsync({ id: editingCourseId, input: payload });
        toast.success("Course updated");
      } else {
        await createCourse.mutateAsync(payload);
        toast.success("Course created");
      }

      setEditingCourseId(null);
      setSelectedCourseId("");
      setCourseCode("");
      setCredits("3");
      setCourseTitle("");
      setSemester("1");
      setLevel("100");
      codeRef.current?.focus();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save course");
    }
  }

  return (
    <section className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="font-lexend text-2xl font-semibold tracking-tight">
            Department Course Management
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Register new courses and assign subject matter experts based on
            workload.
          </p>
        </div>

        <div className="flex gap-3">
          <Button type="button" variant="outline" disabled>
            <MaterialSymbol icon="upload" className="text-[18px]" />
            Bulk Import
          </Button>

          <Button
            type="button"
            onClick={() => {
              setEditingCourseId(null);
              codeRef.current?.focus();
            }}
          >
            <MaterialSymbol icon="add" className="text-[18px]" />
            Create New Course
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-1">
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            <div className="border-b border-border bg-muted/30 px-5 py-4">
              <h2 className="flex items-center gap-2 font-lexend text-sm font-semibold">
                <MaterialSymbol
                  icon="post_add"
                  className="text-[18px] text-primary"
                />
                Course Details
              </h2>
            </div>

            <form
              className="space-y-4 p-6"
              onSubmit={(e) => {
                e.preventDefault();
                void handleSubmit();
              }}
            >
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase text-muted-foreground">
                  Programme
                </label>
                {programmesQuery.isPending ? (
                  <Skeleton className="h-9 w-full" />
                ) : (
                  <Select
                    value={programmeId}
                    onChange={(e) => {
                      const nextProgrammeId = e.target.value;
                      setProgrammeId(nextProgrammeId);
                      setSelectedCourseId("");
                      setEditingCourseId(null);
                      setCourseCode("");
                      setCredits("3");
                      setCourseTitle("");
                      setSemester("1");
                      setLevel("100");
                      codeRef.current?.focus();
                    }}
                  >
                    <option value="">Select programme</option>
                    {(programmesQuery.data ?? []).map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </Select>
                )}
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase text-muted-foreground">
                  Course (auto-fill)
                </label>
                {!programmeId.trim() ? (
                  <Select value="" disabled>
                    <option value="">Select a programme first</option>
                  </Select>
                ) : coursesQuery.isPending ? (
                  <Skeleton className="h-9 w-full" />
                ) : (
                  <Select
                    value={selectedCourseId}
                    onChange={(e) => {
                      const nextCourseId = e.target.value;
                      setSelectedCourseId(nextCourseId);

                      if (!nextCourseId) {
                        setEditingCourseId(null);
                        setCourseCode("");
                        setCredits("3");
                        setCourseTitle("");
                        setSemester("1");
                        setLevel("100");
                        codeRef.current?.focus();
                        return;
                      }

                      const row = (coursesQuery.data?.rows ?? []).find(
                        (c) => c.id === nextCourseId,
                      );
                      if (!row) return;

                      setEditingCourseId(row.id);
                      setCourseCode(row.code);
                      setCourseTitle(row.title);
                      setCredits(String(row.credits));
                      setSemester(String(row.semester));
                      setLevel(row.level !== null ? String(row.level) : "100");
                      codeRef.current?.focus();
                    }}
                  >
                    <option value="">Select course to auto-fill</option>
                    {(coursesQuery.data?.rows ?? []).map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.code} — {c.title}
                      </option>
                    ))}
                  </Select>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase text-muted-foreground">
                    Course Code
                  </label>
                  <Input
                    ref={codeRef}
                    value={courseCode}
                    onChange={(e) => setCourseCode(e.target.value)}
                    placeholder="e.g. ITEC 405"
                    autoComplete="off"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase text-muted-foreground">
                    Credit Units
                  </label>
                  <Input
                    value={credits}
                    onChange={(e) => setCredits(e.target.value)}
                    type="number"
                    min={1}
                    max={30}
                    placeholder="3"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase text-muted-foreground">
                  Course Title
                </label>
                <Input
                  value={courseTitle}
                  onChange={(e) => setCourseTitle(e.target.value)}
                  placeholder="e.g. Software Quality Assurance"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase text-muted-foreground">
                    Semester
                  </label>
                  <Select
                    value={semester}
                    onChange={(e) => setSemester(e.target.value)}
                  >
                    <option value="1">1st Semester</option>
                    <option value="2">2nd Semester</option>
                  </Select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase text-muted-foreground">
                    Level
                  </label>
                  <Select
                    value={level}
                    onChange={(e) => setLevel(e.target.value)}
                  >
                    <option value="100">100</option>
                    <option value="200">200</option>
                    <option value="300">300</option>
                    <option value="400">400</option>
                  </Select>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={createCourse.isPending || updateCourse.isPending}
              >
                {editingCourseId ? "Add Course" : "Add Course"}
              </Button>
            </form>
          </div>

          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-800">
            <div className="flex gap-3">
              <MaterialSymbol
                icon="info"
                className="text-[18px] text-amber-500"
              />
              <div>
                <h4 className="text-sm font-semibold">Assignment Rule</h4>
                <p className="mt-1 text-xs leading-relaxed text-amber-700">
                  Lecturers should not exceed 18 credit hours per semester.
                  {averageLoad !== null
                    ? ` Current department average: ${averageLoad} hours.`
                    : ""}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            <div className="flex items-center justify-between gap-4 border-b border-border px-6 py-5">
              <h2 className="font-lexend text-lg font-semibold">
                Assigned Courses
              </h2>

              <div className="flex items-center gap-2 rounded-lg bg-muted/30 p-1">
                <button
                  type="button"
                  className={cn(
                    "rounded-md px-3 py-1 text-xs font-semibold transition-colors",
                    view === "CURRENT"
                      ? "bg-background shadow-xs"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                  onClick={() => setView("CURRENT")}
                >
                  Current Session
                </button>
                <button
                  type="button"
                  className={cn(
                    "rounded-md px-3 py-1 text-xs font-semibold transition-colors",
                    view === "ARCHIVES"
                      ? "bg-background shadow-xs"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                  onClick={() => setView("ARCHIVES")}
                >
                  Archives
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-muted/30 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    <th className="px-6 py-4">Course Info</th>
                    <th className="px-6 py-4">Lecturer Assignment</th>
                    <th className="px-6 py-4">Load Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-border text-sm">
                  {offeringsQuery.isPending ? (
                    Array.from({ length: 4 }).map((_, idx) => (
                      <tr key={idx}>
                        <td className="px-6 py-4">
                          <Skeleton className="h-4 w-28" />
                          <Skeleton className="mt-2 h-3 w-40" />
                          <Skeleton className="mt-2 h-3 w-32" />
                        </td>
                        <td className="px-6 py-4">
                          <Skeleton className="h-8 w-56" />
                        </td>
                        <td className="px-6 py-4">
                          <Skeleton className="h-4 w-24" />
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Skeleton className="ml-auto h-8 w-20" />
                        </td>
                      </tr>
                    ))
                  ) : offeringsQuery.data?.rows?.length ? (
                    offeringsQuery.data.rows.map((row) => {
                      const load = row.lecturerId
                        ? (lecturersById.get(row.lecturerId)?.loadPercent ??
                          row.loadPercent)
                        : 0;
                      const tone = percentTone(load);

                      return (
                        <tr key={row.offeringId} className="hover:bg-accent/20">
                          <td className="px-6 py-4">
                            <div className="flex flex-col">
                              <span className="font-semibold text-primary">
                                {row.courseCode}
                              </span>
                              <span className="text-xs font-medium">
                                {row.courseTitle}
                              </span>
                              <span className="mt-1 text-[10px] text-muted-foreground">
                                {row.credits} Credits • Level {row.level ?? "—"}
                              </span>
                            </div>
                          </td>

                          <td className="px-6 py-4">
                            {lecturersQuery.isPending ? (
                              <Skeleton className="h-8 w-56" />
                            ) : (
                              <Select
                                value={row.lecturerId ?? ""}
                                onChange={(e) => {
                                  const nextId = e.target.value || null;
                                  setOfferingLecturer
                                    .mutateAsync({
                                      offeringId: row.offeringId,
                                      lecturerId: nextId,
                                    })
                                    .then(() =>
                                      toast.success("Assignment updated"),
                                    )
                                    .catch((err) =>
                                      toast.error(
                                        err instanceof Error
                                          ? err.message
                                          : "Failed to update assignment",
                                      ),
                                    );
                                }}
                                className={cn(
                                  "min-w-55",
                                  (lecturersQuery.data ?? []).find(
                                    (l) => l.id === row.lecturerId,
                                  )?.overload
                                    ? "border-destructive bg-destructive/10"
                                    : null,
                                )}
                              >
                                <option value="">Unassigned</option>
                                {(lecturersQuery.data ?? []).map((l) => (
                                  <option key={l.id} value={l.id}>
                                    {l.name}
                                    {l.overload ? " (Overload)" : ""}
                                  </option>
                                ))}
                              </Select>
                            )}
                          </td>

                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
                                <div
                                  className={cn(
                                    "h-full",
                                    tone === "green"
                                      ? "bg-emerald-500"
                                      : tone === "amber"
                                        ? "bg-amber-500"
                                        : "bg-destructive",
                                  )}
                                  style={{ width: `${Math.min(100, load)}%` }}
                                />
                              </div>
                              <span
                                className={cn(
                                  "text-[10px] font-bold",
                                  tone === "green"
                                    ? "text-emerald-600"
                                    : tone === "amber"
                                      ? "text-amber-600"
                                      : "text-destructive",
                                )}
                              >
                                {row.lecturerId ? `${load}%` : "—"}
                              </span>
                            </div>
                          </td>

                          <td className="px-6 py-4 text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon-sm"
                                aria-label="Edit course"
                                onClick={() => {
                                  setEditingCourseId(row.courseId);
                                  setCourseCode(row.courseCode);
                                  setCourseTitle(row.courseTitle);
                                  setCredits(String(row.credits));
                                  setSemester(String(row.courseSemester));
                                  setLevel(
                                    row.level ? String(row.level) : "100",
                                  );
                                  codeRef.current?.focus();
                                }}
                              >
                                <MaterialSymbol
                                  icon="history"
                                  className="text-[18px] text-muted-foreground"
                                />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon-sm"
                                aria-label="Delete course"
                                onClick={() => {
                                  const ok = window.confirm(
                                    `Delete ${row.courseCode} (${row.courseTitle})? This cannot be undone.`,
                                  );
                                  if (!ok) return;

                                  deleteCourse
                                    .mutateAsync(row.courseId)
                                    .then(() => toast.success("Course deleted"))
                                    .catch((err) =>
                                      toast.error(
                                        err instanceof Error
                                          ? err.message
                                          : "Failed to delete course",
                                      ),
                                    );
                                }}
                              >
                                <MaterialSymbol
                                  icon="delete"
                                  className="text-[18px] text-muted-foreground"
                                />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-6 py-10 text-center text-sm text-muted-foreground"
                      >
                        No assigned courses found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="border-t border-border px-6 py-4 text-xs text-muted-foreground">
              {offeringsQuery.isPending
                ? "Loading..."
                : `Showing ${(offeringsQuery.data?.rows ?? []).length} active courses in current view`}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
