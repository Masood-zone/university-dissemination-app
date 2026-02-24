"use client";

import * as React from "react";
import { useGetEnrollmentStatus } from "@/services/enrollment/enrollment";
import { MaterialSymbol } from "@/components/common/MaterialSymbol";
import { PendingApprovalModal } from "@/components/student/PendingApprovalModal";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

function PlaceholderCard({
  title,
  subtitle,
  icon,
}: {
  title: string;
  subtitle: string;
  icon: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <div className="flex items-start gap-4">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-muted/40">
          <MaterialSymbol
            icon={icon}
            className="text-[20px] text-muted-foreground"
          />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold truncate">{title}</p>
          <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
        </div>
      </div>
      <div className="mt-5 h-9 rounded-xl bg-muted/40" />
    </div>
  );
}

export default function StudentDashboardPage() {
  const { data, isLoading, isError } = useGetEnrollmentStatus();
  const { data: session } = authClient.useSession();

  const user = (session as unknown as { user?: Record<string, unknown> })?.user;
  const studentName =
    (typeof user?.name === "string" && user.name) ||
    `${typeof user?.firstName === "string" ? user.firstName : ""} ${
      typeof user?.lastName === "string" ? user.lastName : ""
    }`.trim();

  const status = data?.status ?? (isError ? "UNKNOWN" : "PENDING");
  const isApproved = status === "APPROVED";
  const showPendingModal = !isLoading && !isError && !isApproved;

  return (
    <div className="relative">
      <div
        className={cn(
          "space-y-6 transition-[filter,opacity]",
          showPendingModal
            ? "pointer-events-none select-none blur-sm grayscale-20"
            : "",
        )}
        aria-hidden={showPendingModal}
      >
        <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Student Portal
            </p>
            <h1 className="font-lexend text-2xl font-semibold tracking-tight">
              Dashboard
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {studentName ? `Welcome back, ${studentName}` : "Welcome back"}
            </p>
          </div>

          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-semibold text-muted-foreground">
            <MaterialSymbol icon="shield" className="text-[16px]" />
            {isLoading
              ? "Checking status..."
              : isApproved
                ? "Approved"
                : "Access restricted"}
          </div>
        </header>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Next Class In
                </p>
                <p className="mt-2 font-lexend text-4xl font-extrabold tracking-tight">
                  --:--
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  Schedule unlocks after approval
                </p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-muted/40">
                <MaterialSymbol
                  icon="schedule"
                  className="text-[20px] text-muted-foreground"
                />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-muted/40">
                <MaterialSymbol
                  icon="account_balance_wallet"
                  className="text-[20px] text-muted-foreground"
                />
              </div>
              <div>
                <p className="text-sm font-semibold">Outstanding Fees Alert</p>
                <p className="mt-1 text-xs text-muted-foreground italic">
                  Data locked
                </p>
              </div>
            </div>
            <div className="mt-5 h-9 rounded-xl bg-muted/40" />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <PlaceholderCard
            title="Academic Calendar"
            subtitle="Important dates & schedules"
            icon="calendar_today"
          />
          <PlaceholderCard
            title="Course Offerings"
            subtitle="View available courses"
            icon="menu_book"
          />
          <PlaceholderCard
            title="Assignments"
            subtitle="Tasks & deadlines"
            icon="assignment"
          />
          <PlaceholderCard
            title="Grades & CGPA"
            subtitle="Performance overview"
            icon="grade"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="rounded-2xl border border-border bg-card p-6 lg:col-span-2">
            <p className="text-sm font-semibold">Announcements</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Your feed will appear here after approval.
            </p>
            <div className="mt-5 h-56 rounded-2xl bg-muted/40" />
          </div>
          <div className="rounded-2xl border border-border bg-card p-6">
            <p className="text-sm font-semibold">Upcoming Deadlines</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Deadlines unlock after approval.
            </p>
            <div className="mt-5 h-56 rounded-2xl bg-muted/40" />
          </div>
        </div>
      </div>

      <PendingApprovalModal open={showPendingModal} studentName={studentName} />
    </div>
  );
}
