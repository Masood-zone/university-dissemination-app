"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import * as React from "react";

import { ProgrammeStepper } from "@/components/admin/programmes-and-courses/ProgrammeStepper";
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
import { cn } from "@/lib/utils";
import { getApiErrorLabel } from "@/lib/api-client-error";
import { useGetDepartmentInfo } from "@/services/admin/department-management/department";
import { useCreateProgramme } from "@/services/admin/programmes-and-courses/programmes";
import type { ProgrammeListItem } from "@/types";

type AwardType = ProgrammeListItem["awardType"];

const steps = [
  { title: "Basic Information", subtitle: "Name, code & award type" },
  { title: "Department", subtitle: "Faculty assignment" },
  { title: "Requirements", subtitle: "Duration & credit hours" },
  { title: "Review & Publish", subtitle: "Final verification" },
];

export default function AddProgrammePage() {
  const router = useRouter();
  const [step, setStep] = React.useState(1);

  const departmentsQuery = useGetDepartmentInfo();
  const createProgramme = useCreateProgramme();

  const [name, setName] = React.useState("");
  const [code, setCode] = React.useState("");
  const [awardType, setAwardType] = React.useState<AwardType>("UNDERGRADUATE");
  const [departmentId, setDepartmentId] = React.useState("");
  const [numSemesters, setNumSemesters] = React.useState("8");
  const [minCredits, setMinCredits] = React.useState("120");
  const [durationYears, setDurationYears] = React.useState("4");

  const departments = departmentsQuery.data?.departments ?? [];
  const selectedDepartment = React.useMemo(() => {
    return departments.find((d) => d.id === departmentId) ?? null;
  }, [departments, departmentId]);

  React.useEffect(() => {
    if (departmentId) return;
    const first = departments[0];
    if (first) setDepartmentId(first.id);
  }, [departments, departmentId]);

  const canNext = step < 4;
  const canPrev = step > 1;

  const next = () => {
    if (canNext) setStep((s) => s + 1);
  };
  const prev = () => {
    if (canPrev) setStep((s) => s - 1);
  };

  const submit = async () => {
    const durationYearsNum = Number.parseInt(durationYears, 10);
    const totalSemestersNum = Number.parseInt(numSemesters, 10);
    const minCreditsNum = Number.parseInt(minCredits, 10);

    await createProgramme.mutateAsync({
      name,
      code,
      awardType,
      departmentId,
      durationYears: Number.isFinite(durationYearsNum)
        ? durationYearsNum
        : undefined,
      totalSemesters: Number.isFinite(totalSemestersNum)
        ? totalSemestersNum
        : undefined,
      minCredits: Number.isFinite(minCreditsNum) ? minCreditsNum : undefined,
    });

    router.push("/administrator/programmes-and-courses");
  };

  return (
    <div className="flex gap-6">
      <aside className="hidden xl:block w-80 shrink-0 rounded-2xl border border-border bg-card p-6 overflow-y-auto">
        <h2 className="font-lexend text-xl font-semibold">New Programme</h2>
        <div className="mt-8">
          <ProgrammeStepper steps={steps} activeStep={step} />
        </div>

        <div className="mt-8 rounded-xl border border-border bg-muted/40 p-4">
          <div className="flex items-center gap-2">
            <MaterialSymbol icon="info" className="text-[18px] text-primary" />
            <p className="text-[11px] font-semibold uppercase tracking-wider">
              Guidelines
            </p>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Ensure the programme code follows your institution standard format
            (e.g., BSc-ITE).
          </p>
        </div>
      </aside>

      <section className="flex-1 min-w-0">
        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="flex items-start justify-between gap-6">
            <div>
              <h1 className="font-lexend text-xl font-semibold">
                Step {step}: {steps[step - 1]?.title}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Enter the core identifiers for the new academic programme.
              </p>
            </div>
            <p className="text-xs font-semibold text-muted-foreground">
              Step {step} of 4
            </p>
          </div>

          <div className="mt-6 space-y-6">
            {step === 1 ? (
              <div className="space-y-5">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Programme full name
                  </label>
                  <Input
                    className="mt-2"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Bachelor of Science in Information Technology Education"
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Programme code
                    </label>
                    <Input
                      className="mt-2"
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      placeholder="e.g. BSc-ITE"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Award type
                    </label>
                    <Select
                      value={awardType}
                      onValueChange={(value) =>
                        setAwardType(value as AwardType)
                      }
                    >
                      <SelectTrigger className="mt-2 w-full">
                        <SelectValue placeholder="Select award type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="UNDERGRADUATE">
                          Undergraduate
                        </SelectItem>
                        <SelectItem value="POSTGRADUATE">
                          Postgraduate
                        </SelectItem>
                        <SelectItem value="DIPLOMA">Diploma</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Department assignment
                  </label>
                  <Select
                    value={departmentId || undefined}
                    onValueChange={setDepartmentId}
                    disabled={departmentsQuery.isLoading}
                  >
                    <SelectTrigger className="mt-2 w-full">
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map((d) => (
                        <SelectItem key={d.id} value={d.id}>
                          {d.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Number of semesters
                    </label>
                    <Input
                      className="mt-2"
                      value={numSemesters}
                      onChange={(e) => setNumSemesters(e.target.value)}
                      placeholder="e.g. 8"
                    />
                    <p className="mt-1 text-[10px] text-muted-foreground">
                      Semesters
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Min. credit hours
                    </label>
                    <Input
                      className="mt-2"
                      value={minCredits}
                      onChange={(e) => setMinCredits(e.target.value)}
                      placeholder="e.g. 120"
                    />
                    <p className="mt-1 text-[10px] text-muted-foreground">
                      Credits
                    </p>
                  </div>
                </div>
              </div>
            ) : null}

            {step === 2 ? (
              <div className="space-y-4">
                <p className="text-sm font-semibold">Department</p>
                <p className="text-sm text-muted-foreground">
                  Department assignment is captured in Step 1. This step will
                  later include staff approvals and faculty mapping.
                </p>
                <div className="rounded-xl border border-border bg-muted/40 p-4">
                  <p className="text-sm font-medium">Selected department</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {selectedDepartment?.name || "—"}
                  </p>
                </div>
              </div>
            ) : null}

            {step === 3 ? (
              <div className="space-y-5">
                <p className="text-sm font-semibold">Requirements</p>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Duration (years)
                    </label>
                    <Input
                      className="mt-2"
                      value={durationYears}
                      onChange={(e) => setDurationYears(e.target.value)}
                      placeholder="e.g. 4"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Minimum credits
                    </label>
                    <Input
                      className="mt-2"
                      value={minCredits}
                      onChange={(e) => setMinCredits(e.target.value)}
                      placeholder="e.g. 120"
                    />
                  </div>
                </div>
              </div>
            ) : null}

            {step === 4 ? (
              <div className="space-y-4">
                <p className="text-sm font-semibold">Review</p>
                <div className="rounded-xl border border-border bg-muted/40 p-4 text-sm">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground">
                        Programme
                      </p>
                      <p className="font-semibold">{name || "—"}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground">
                        Code
                      </p>
                      <p className="font-semibold">{code || "—"}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground">
                        Award type
                      </p>
                      <p className="font-semibold">{awardType}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground">
                        Department
                      </p>
                      <p className="font-semibold">
                        {selectedDepartment?.name || "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground">
                        Semesters
                      </p>
                      <p className="font-semibold">{numSemesters || "—"}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground">
                        Min credits
                      </p>
                      <p className="font-semibold">{minCredits || "—"}</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          <div
            className={cn(
              "mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between",
            )}
          >
            <Button asChild variant="outline" className="gap-2">
              <Link href="/administrator/programmes-and-courses">
                <MaterialSymbol icon="close" className="text-[18px]" />
                Cancel
              </Link>
            </Button>

            <div className="flex items-center justify-end gap-3">
              <Button
                variant="ghost"
                type="button"
                onClick={prev}
                disabled={!canPrev}
              >
                Previous
              </Button>
              {step < 4 ? (
                <Button type="button" onClick={next} className="gap-2">
                  Next Step
                  <MaterialSymbol
                    icon="arrow_right_alt"
                    className="text-[18px]"
                  />
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={submit}
                  className="gap-2"
                  disabled={
                    createProgramme.isPending ||
                    !name.trim() ||
                    !code.trim() ||
                    !departmentId
                  }
                >
                  Create Programme
                  <MaterialSymbol icon="check" className="text-[18px]" />
                </Button>
              )}
            </div>
          </div>

          {createProgramme.isError ? (
            <div className="mt-4 rounded-xl border border-border bg-muted/40 p-4">
              <p className="text-sm font-semibold">Create failed</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {getApiErrorLabel(createProgramme.error).message}
              </p>
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
