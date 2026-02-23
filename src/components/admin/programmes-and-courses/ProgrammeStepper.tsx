"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

export type ProgrammeWizardStep = {
  title: string;
  subtitle: string;
};

export function ProgrammeStepper({
  steps,
  activeStep,
}: {
  steps: ProgrammeWizardStep[];
  activeStep: number;
}) {
  return (
    <div className="space-y-6 relative">
      <div className="absolute left-6 top-2 bottom-2 w-px bg-border" />
      {steps.map((step, idx) => {
        const stepNum = idx + 1;
        const isActive = stepNum === activeStep;
        const isDone = stepNum < activeStep;

        return (
          <div key={step.title} className="relative z-10 flex gap-4">
            <div
              className={cn(
                "flex h-12 w-12 items-center justify-center rounded-full border-2 text-sm font-bold",
                isActive
                  ? "border-primary text-primary bg-primary/10"
                  : isDone
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border text-muted-foreground bg-background",
              )}
            >
              {isDone ? "✓" : stepNum}
            </div>
            <div className="pt-1">
              <p
                className={cn(
                  "text-sm font-bold",
                  isActive ? "text-primary" : "text-muted-foreground",
                )}
              >
                {step.title}
              </p>
              <p className="text-xs text-muted-foreground">{step.subtitle}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
