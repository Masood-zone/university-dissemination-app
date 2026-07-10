"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import * as React from "react";

import { CourseLivePreview } from "@/components/admin/programmes-and-courses/CourseLivePreview";
import { MaterialSymbol } from "@/components/common/MaterialSymbol";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { getApiErrorLabel } from "@/lib/api-client-error";
import {
  useCreateProgrammeCourse,
  useGetProgrammeDetails,
} from "@/services/admin/programmes-and-courses/programmes";

export default function AddCoursePage() {
  return (
    <React.Suspense
      fallback={
        <div className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">
          Loading...
        </div>
      }
    >
      <AddCoursePageInner />
    </React.Suspense>
  );
}

function AddCoursePageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const programmeId = searchParams.get("programmeId");

  const programmeQuery = useGetProgrammeDetails(programmeId);
  const createCourse = useCreateProgrammeCourse();

  const [title, setTitle] = React.useState("");
  const [code, setCode] = React.useState("");
  const [credits, setCredits] = React.useState("3");
  const [description, setDescription] = React.useState("");
  const [prereq, setPrereq] = React.useState<string | null>(null);

  const prerequisites = prereq ? [prereq] : [];
  const creditsNum = Number.parseInt(credits, 10);

  const submit = async () => {
    if (!programmeId) return;
    await createCourse.mutateAsync({
      programmeId,
      title,
      code,
      credits: Number.isFinite(creditsNum) ? creditsNum : 0,
      description: description || undefined,
      prerequisites,
      semester: 1,
    });

    router.push("/administrator/programmes-and-courses");
  };

  const programmeName = programmeQuery.data?.programme.name;
  const coursesCount = programmeQuery.data?.coursesCount;
  const prereqOptions = programmeQuery.data?.prerequisiteOptions ?? [];

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="icon-sm">
            <Link
              href="/administrator/programmes-and-courses"
              aria-label="Back"
            >
              <MaterialSymbol icon="arrow_back" className="text-[18px]" />
            </Link>
          </Button>
          <h1 className="font-display text-xl font-semibold">
            Create New Course
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <Button asChild variant="outline">
            <Link href="/administrator/programmes-and-courses">Cancel</Link>
          </Button>
          <Button
            className="gap-2"
            type="button"
            onClick={submit}
            disabled={!programmeId || createCourse.isPending}
          >
            <MaterialSymbol icon="save" className="text-[18px]" />
            Save Course
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div>
            <p className="text-xs text-muted-foreground">
              Programmes <span className="mx-1">›</span>{" "}
              {programmeName ?? programmeId ?? "Programme"}
              <span className="mx-1">›</span>
              <span className="text-primary font-semibold">New Course</span>
            </p>
            <h2 className="mt-2 font-display text-2xl font-semibold">
              Course Configuration
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Set up curriculum details for the new academic course entry.
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Basic Information
            </p>

            <div className="mt-6 space-y-5">
              <div>
                <label className="text-sm font-semibold">Course Title</label>
                <Input
                  className="mt-2"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Introduction to Programming"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-semibold">Course Code</label>
                  <Input
                    className="mt-2"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="e.g. ITEC 201"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold">Credit Units</label>
                  <Select
                    value={credits}
                    onValueChange={(value) => setCredits(value)}
                  >
                    <SelectTrigger className="mt-2 w-full">
                      <SelectValue placeholder="Select credit unit(s)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 Unit</SelectItem>
                      <SelectItem value="2">2 Units</SelectItem>
                      <SelectItem value="3">3 Units</SelectItem>
                      <SelectItem value="4">4 Units</SelectItem>
                      <SelectItem value="5">5 Units</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold">
                  Course Description
                </label>
                <Textarea
                  className="mt-2 min-h-28"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief overview of course objectives and content..."
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="rounded-2xl border border-border bg-card p-6 md:col-span-2">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Classification & Requirements
              </p>
              <div className="mt-6 grid grid-cols-3 gap-3">
                {[
                  { key: "CORE", label: "CORE" },
                  { key: "ELECTIVE", label: "ELECTIVE" },
                  { key: "GENERAL", label: "GENERAL" },
                ].map((i) => (
                  <button
                    key={i.key}
                    type="button"
                    className="rounded-xl border border-border bg-background px-4 py-6 text-xs font-semibold hover:bg-accent"
                  >
                    {i.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-6">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Prerequisites
              </p>
              <div className="mt-4">
                <Input placeholder="Search course" />
              </div>
              <div className="mt-4 space-y-2">
                {prereqOptions.map((c) => {
                  const isSelected = prereq === c.code;
                  return (
                    <button
                      key={c.code}
                      type="button"
                      onClick={() => setPrereq(isSelected ? null : c.code)}
                      className={cn(
                        "w-full rounded-xl border px-3 py-2 text-left",
                        isSelected
                          ? "border-primary bg-primary/10"
                          : "border-border hover:bg-accent",
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-semibold">{c.code}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {c.title}
                          </p>
                        </div>
                        <MaterialSymbol
                          icon={isSelected ? "close" : "add"}
                          className="text-[18px] text-muted-foreground"
                        />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-amber-500/10 p-6 md:col-span-2">
              <div className="flex items-center gap-2">
                <MaterialSymbol
                  icon="info"
                  className="text-[18px] text-amber-600"
                />
                <p className="text-[11px] font-semibold uppercase tracking-wider text-amber-700">
                  Guidelines
                </p>
              </div>
              <ul className="mt-3 space-y-2 text-xs text-muted-foreground">
                <li>Course codes must follow the (DEPT)-(LEVEL) format.</li>
                <li>Core courses require departmental approval.</li>
                <li>
                  Prerequisites will automatically link curricula across
                  semesters.
                </li>
              </ul>
            </div>
          </div>
        </div>

        <aside className="space-y-6">
          <div>
            <p className="text-sm font-semibold">Live Preview</p>
            <p className="text-[11px] text-muted-foreground uppercase tracking-wider">
              Catalog Card View
            </p>
          </div>
          <CourseLivePreview
            title={title}
            code={code}
            credits={credits}
            description={description}
            prerequisite={prereq}
          />

          <div className="rounded-2xl border border-border bg-card p-5">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Target Programme
            </p>
            <p className="mt-2 text-sm font-semibold">{programmeName ?? "—"}</p>
            <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
              <span>Current Courses:</span>
              <span className="font-semibold text-foreground">
                {typeof coursesCount === "number" ? coursesCount : "—"}
              </span>
            </div>
          </div>

          <Button
            className="w-full gap-2"
            type="button"
            onClick={submit}
            disabled={!programmeId || createCourse.isPending}
          >
            <MaterialSymbol icon="upload" className="text-[18px]" />
            Create Course
          </Button>
          <p className="text-[11px] text-muted-foreground text-center">
            Preview reflects student portal visibility.
          </p>

          {!programmeId ? (
            <div className="rounded-2xl border border-border bg-card p-5">
              <p className="text-sm font-semibold">Missing programme</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Open this page from a programme row so it includes
                ?programmeId=....
              </p>
            </div>
          ) : programmeQuery.isError ? (
            <div className="rounded-2xl border border-border bg-card p-5">
              <p className="text-sm font-semibold">Unable to load programme</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {getApiErrorLabel(programmeQuery.error).message}
              </p>
            </div>
          ) : createCourse.isError ? (
            <div className="rounded-2xl border border-border bg-card p-5">
              <p className="text-sm font-semibold">Create failed</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {getApiErrorLabel(createCourse.error).message}
              </p>
            </div>
          ) : null}
        </aside>
      </div>
    </section>
  );
}
