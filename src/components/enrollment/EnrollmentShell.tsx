"use client";

import * as React from "react";

import { EnrollmentNavbar } from "@/components/enrollment/EnrollmentNavbar";
import { EnrollmentStepper } from "@/components/enrollment/EnrollmentStepper";
import { useEnrollmentStore } from "@/stores/enrollmentStore";

export function EnrollmentShell({
  step,
  title,
  subtitle,
  children,
}: {
  step: 1 | 2 | 3 | 4;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  const applicationId = useEnrollmentStore((s) => s.draft.draftId);

  return (
    <div className="min-h-dvh bg-background">
      <EnrollmentNavbar applicationId={applicationId} />

      <main className="pt-24 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl space-y-8">
          <header>
            <div className="flex flex-col gap-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Step {step} of 4
              </p>
              <h1 className="font-lexend text-2xl font-semibold tracking-tight">
                {title}
              </h1>
              {subtitle ? (
                <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
              ) : null}
            </div>
          </header>

          <EnrollmentStepper activeStep={step} />

          <div className="rounded-2xl border border-border bg-card">
            <div className="p-6">{children}</div>
          </div>
        </div>
      </main>
    </div>
  );
}
