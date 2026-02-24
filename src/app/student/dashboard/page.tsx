"use client";

import * as React from "react";
import { MaterialSymbol } from "@/components/common/MaterialSymbol";
import { Button } from "@/components/ui/button";
import { useGetEnrollmentStatus } from "@/services/enrollment/enrollment";

function StatusBadge({ status }: { status: string }) {
  const tone =
    status === "APPROVED"
      ? "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200"
      : "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200";

  const label = status === "APPROVED" ? "Approved" : "Pending Approval";

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${tone}`}
    >
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full rounded-full bg-current opacity-20" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-current" />
      </span>
      {label}
    </div>
  );
}

export default function StudentDashboardPage() {
  const { data, isLoading, isError, refetch } = useGetEnrollmentStatus();

  const status = data?.status ?? "PENDING";

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Student Portal
          </p>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
        </div>
        <StatusBadge status={status} />
      </header>

      <div className="rounded-2xl border border-border bg-card p-6">
        {isLoading ? (
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <MaterialSymbol icon="progress_activity" className="text-[18px]" />
            Loading your application status...
          </div>
        ) : isError ? (
          <div className="space-y-3">
            <div className="flex items-start gap-3 text-sm">
              <MaterialSymbol
                icon="error"
                className="mt-0.5 text-[18px] text-destructive"
              />
              <div>
                <p className="font-semibold text-destructive">
                  Unable to load status
                </p>
                <p className="mt-1 text-muted-foreground">
                  Please ensure you’re logged in as a student.
                </p>
              </div>
            </div>
            <Button type="button" variant="outline" onClick={() => refetch()}>
              Retry
            </Button>
          </div>
        ) : status === "APPROVED" ? (
          <div className="space-y-2">
            <div className="flex items-start gap-3">
              <MaterialSymbol
                icon="verified"
                className="mt-0.5 text-[18px] text-emerald-600 dark:text-emerald-300"
              />
              <div>
                <p className="text-sm font-semibold">
                  Your application is approved
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  You can proceed with the next onboarding steps.
                </p>
              </div>
            </div>
            {data?.applicationNo ? (
              <p className="mt-3 text-xs text-muted-foreground">
                Application No:{" "}
                <span className="font-semibold">{data.applicationNo}</span>
              </p>
            ) : null}
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-start gap-3">
              <MaterialSymbol
                icon="hourglass_top"
                className="mt-0.5 text-[18px] text-amber-600 dark:text-amber-300"
              />
              <div>
                <p className="text-sm font-semibold">Enrollment submitted</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Your application is pending approval. You’ll be notified once
                  it’s reviewed.
                </p>
              </div>
            </div>
            {data?.applicationNo ? (
              <p className="mt-3 text-xs text-muted-foreground">
                Application No:{" "}
                <span className="font-semibold">{data.applicationNo}</span>
              </p>
            ) : null}
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-border bg-muted/40 p-6">
        <p className="text-sm font-semibold">Need help?</p>
        <p className="mt-1 text-sm text-muted-foreground">
          If your status hasn’t changed after some time, contact the admissions
          office.
        </p>
      </div>
    </div>
  );
}
