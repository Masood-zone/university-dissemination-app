"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
import { MaterialSymbol } from "@/components/common/MaterialSymbol";

export function EnrollmentStepper({
  activeStep,
}: {
  activeStep: 1 | 2 | 3 | 4;
}) {
  const steps = [
    { n: 1, label: "Personal Info", icon: "person" },
    { n: 2, label: "Department", icon: "apartment" },
    { n: 3, label: "Programme", icon: "school" },
    { n: 4, label: "Review", icon: "fact_check" },
  ] as const;

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="relative">
        <div className="absolute left-0 top-5 h-px w-full bg-border" />
        <div
          className="absolute left-0 top-5 h-0.5 bg-secondary"
          style={{ width: `${((activeStep - 1) / 3) * 100}%` }}
        />

        <ol className="relative z-10 grid grid-cols-4 gap-3">
          {steps.map((s) => {
            const isActive = s.n === activeStep;
            const isDone = s.n < activeStep;

            return (
              <li key={s.n} className="flex flex-col items-center">
                <div
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-full border bg-background",
                    isDone
                      ? "border-secondary bg-secondary text-secondary-foreground"
                      : isActive
                        ? "border-primary bg-accent text-primary ring-2 ring-secondary/40"
                        : "border-border text-muted-foreground",
                  )}
                  aria-current={isActive ? "step" : undefined}
                >
                  {isDone ? (
                    <MaterialSymbol icon="check" className="text-[20px]" />
                  ) : (
                    <MaterialSymbol icon={s.icon} className="text-[20px]" />
                  )}
                </div>

                <p
                  className={cn(
                    "mt-2 text-[10px] font-semibold uppercase tracking-wider",
                    isActive ? "text-foreground" : "text-muted-foreground",
                  )}
                >
                  {s.label}
                </p>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
