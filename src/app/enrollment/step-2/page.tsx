"use client";

import { useRouter } from "next/navigation";

import * as React from "react";

import { EnrollmentShell } from "@/components/enrollment/EnrollmentShell";
import { MaterialSymbol } from "@/components/common/MaterialSymbol";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useGetEnrollmentDepartments } from "@/services/enrollment/enrollment";
import { useEnrollmentStore } from "@/stores/enrollmentStore";

export default function EnrollmentStep2Page() {
  const router = useRouter();
  const academic = useEnrollmentStore((s) => s.draft.academic);
  const setAcademic = useEnrollmentStore((s) => s.setAcademic);

  const {
    data: departments,
    isLoading,
    error,
    refetch,
  } = useGetEnrollmentDepartments();

  const [query, setQuery] = React.useState("");
  const q = query.trim().toLowerCase();
  const rows = React.useMemo(() => {
    const src = departments ?? [];
    if (!q) return src;
    return src.filter((d) => d.name.toLowerCase().includes(q));
  }, [departments, q]);

  const selected = (departments ?? []).find(
    (d) => d.id === academic.departmentId,
  );

  return (
    <EnrollmentShell
      step={2}
      title="Department of Interest"
      subtitle="Select the department you wish to enroll in for your chosen programme."
    >
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:w-96">
            <MaterialSymbol
              icon="search"
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-muted-foreground"
            />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search departments (e.g. Computing, Business...)"
              className="pl-9"
            />
          </div>

          {error ? (
            <Button type="button" variant="outline" onClick={() => refetch()}>
              Retry
            </Button>
          ) : null}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {isLoading
            ? Array.from({ length: 6 }).map((_, idx) => (
                <div
                  key={idx}
                  className="rounded-2xl border border-border bg-background p-5"
                >
                  <div className="flex items-start gap-3">
                    <Skeleton className="h-10 w-10 rounded-xl" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="mt-2 h-3 w-full" />
                      <Skeleton className="mt-2 h-3 w-2/3" />
                    </div>
                  </div>
                </div>
              ))
            : rows.map((d) => {
                const isSelected = academic.departmentId === d.id;
                return (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() =>
                      setAcademic({ departmentId: d.id, programmeId: "" })
                    }
                    className={cn(
                      "rounded-2xl border border-border bg-background p-5 text-left transition-colors hover:bg-accent/40",
                      isSelected && "border-primary bg-primary/10",
                    )}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div
                          className={cn(
                            "flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card",
                            isSelected && "border-primary/40",
                          )}
                        >
                          <MaterialSymbol
                            icon="domain"
                            className={cn(
                              "text-[20px]",
                              isSelected
                                ? "text-primary"
                                : "text-muted-foreground",
                            )}
                          />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold leading-tight">
                            {d.name}
                          </p>
                          <p className="mt-2 text-xs text-muted-foreground line-clamp-2">
                            {d.description || "Select to continue."}
                          </p>
                          <div className="mt-3 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                            <MaterialSymbol
                              icon="location_on"
                              className="text-[14px]"
                            />
                            {d.code}
                          </div>
                        </div>
                      </div>

                      <MaterialSymbol
                        icon={
                          isSelected ? "check_circle" : "radio_button_unchecked"
                        }
                        className={cn(
                          "text-[20px]",
                          isSelected ? "text-primary" : "text-muted-foreground",
                        )}
                      />
                    </div>
                  </button>
                );
              })}
        </div>

        <div className="rounded-2xl border border-border bg-muted/40 p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Selected Department
          </p>
          <p className="mt-2 text-sm font-semibold">{selected?.name ?? "—"}</p>
          {selected?.code ? (
            <p className="mt-1 text-xs text-muted-foreground">
              Department Code: {selected.code}
            </p>
          ) : null}
        </div>

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/enrollment/step-1")}
            className="gap-2"
          >
            <MaterialSymbol icon="arrow_back" className="text-[18px]" />
            Back
          </Button>

          <div className="flex items-center justify-end gap-3">
            <Button
              type="button"
              className="gap-2"
              disabled={!academic.departmentId}
              onClick={() => router.push("/enrollment/step-3")}
            >
              Continue
              <MaterialSymbol icon="arrow_right_alt" className="text-[18px]" />
            </Button>
          </div>
        </div>
      </div>
    </EnrollmentShell>
  );
}
