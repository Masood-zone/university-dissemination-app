"use client";

import { useRouter } from "next/navigation";

import * as React from "react";

import { EnrollmentShell } from "@/components/enrollment/EnrollmentShell";
import { MaterialSymbol } from "@/components/common/MaterialSymbol";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  useGetEnrollmentDepartments,
  useGetEnrollmentProgrammes,
} from "@/services/enrollment/enrollment";
import { useEnrollmentStore } from "@/stores/enrollmentStore";

export default function EnrollmentStep3Page() {
  const router = useRouter();
  const academic = useEnrollmentStore((s) => s.draft.academic);
  const setAcademic = useEnrollmentStore((s) => s.setAcademic);

  const { data: departments } = useGetEnrollmentDepartments();
  const {
    data: programmesData,
    isLoading,
    error,
    refetch,
  } = useGetEnrollmentProgrammes(academic.departmentId || null);

  const [query, setQuery] = React.useState("");
  const q = query.trim().toLowerCase();

  const programmes = React.useMemo(() => {
    const src = programmesData ?? [];
    if (!q) return src;
    return src.filter((p) => {
      return (
        p.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q)
      );
    });
  }, [programmesData, q]);

  const selectedProgramme = (programmesData ?? []).find(
    (p) => p.id === academic.programmeId,
  );

  const selectedDepartmentName =
    (departments ?? []).find((d) => d.id === academic.departmentId)?.name ??
    "—";

  return (
    <EnrollmentShell
      step={3}
      title="Select Academic Programme"
      subtitle="Please choose your preferred programme of study for the academic session."
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative w-full sm:w-96">
                <MaterialSymbol
                  icon="search"
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-muted-foreground"
                />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search programmes (e.g. Information Technology...)"
                  className="pl-9"
                />
              </div>

              <div className="flex items-center gap-2">
                <div className="rounded-full border border-border bg-muted/40 px-3 py-1 text-[11px] font-semibold text-muted-foreground">
                  {(programmesData ?? []).length} Programmes
                </div>
                {error ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => refetch()}
                  >
                    Retry
                  </Button>
                ) : null}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {isLoading
                ? Array.from({ length: 3 }).map((_, idx) => (
                    <div
                      key={idx}
                      className="rounded-2xl border border-border bg-background p-5"
                    >
                      <Skeleton className="h-4 w-2/3" />
                      <Skeleton className="mt-3 h-3 w-1/3" />
                      <Skeleton className="mt-4 h-3 w-full" />
                      <Skeleton className="mt-2 h-3 w-4/5" />
                    </div>
                  ))
                : programmes.map((p) => {
                    const isSelected = academic.programmeId === p.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setAcademic({ programmeId: p.id })}
                        className={cn(
                          "rounded-2xl border border-border bg-background p-5 text-left transition-colors hover:bg-accent/40",
                          isSelected && "border-primary bg-primary/10",
                        )}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="text-sm font-semibold">{p.name}</p>
                              <span className="rounded-full border border-border bg-card px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                                {p.awardTypeLabel}
                              </span>
                            </div>
                            <p className="mt-2 text-xs text-muted-foreground">
                              <span className="font-semibold">Duration:</span>{" "}
                              {p.durationLabel}
                            </p>

                            <div className="mt-4">
                              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                                Entry requirements
                              </p>
                              <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                                <li>
                                  • Requirements will be verified after review.
                                </li>
                                <li>
                                  • You may be contacted for additional details.
                                </li>
                              </ul>
                            </div>
                          </div>

                          <MaterialSymbol
                            icon={
                              isSelected
                                ? "check_circle"
                                : "radio_button_unchecked"
                            }
                            className={cn(
                              "text-[20px]",
                              isSelected
                                ? "text-primary"
                                : "text-muted-foreground",
                            )}
                          />
                        </div>
                      </button>
                    );
                  })}
            </div>
          </div>

          <aside className="space-y-4">
            <div className="rounded-2xl border border-border bg-muted/40 p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Selection Summary
              </p>
              <div className="mt-4 space-y-3 text-sm">
                <div className="flex items-start justify-between gap-3">
                  <span className="text-muted-foreground">Department</span>
                  <span className="text-right font-semibold">
                    {selectedDepartmentName}
                  </span>
                </div>
                <div className="flex items-start justify-between gap-3">
                  <span className="text-muted-foreground">Programme</span>
                  <span className="text-right font-semibold">
                    {selectedProgramme?.name ?? "—"}
                  </span>
                </div>
                <div className="flex items-start justify-between gap-3">
                  <span className="text-muted-foreground">Code</span>
                  <span className="text-right font-semibold">
                    {selectedProgramme?.code ?? "—"}
                  </span>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-5">
              <div className="flex items-center gap-2">
                <MaterialSymbol
                  icon="info"
                  className="text-[18px] text-primary"
                />
                <p className="text-[11px] font-semibold uppercase tracking-wider">
                  Note
                </p>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                You can go back at any time to change your department or
                programme.
              </p>
            </div>
          </aside>
        </div>

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/enrollment/step-2")}
            className="gap-2"
          >
            <MaterialSymbol icon="arrow_back" className="text-[18px]" />
            Back
          </Button>

          <Button
            type="button"
            className="gap-2"
            disabled={!academic.programmeId}
            onClick={() => router.push("/enrollment/step-4")}
          >
            Continue
            <MaterialSymbol icon="arrow_right_alt" className="text-[18px]" />
          </Button>
        </div>
      </div>
    </EnrollmentShell>
  );
}
