"use client";

import * as React from "react";
import { useGetEnrollmentStatus } from "@/services/enrollment/enrollment";
import { useStudentDashboardAnalytics } from "@/services/student/dashboard/dashboard";
import { MaterialSymbol } from "@/components/common/MaterialSymbol";
import { PendingApprovalModal } from "@/components/student/PendingApprovalModal";
import { authClient } from "@/lib/auth-client";
import { cn, getDayOfWeekName, formatGhs, timeAgo } from "@/lib/utils";

function formatMinutesToHHMM(totalMinutes: number): string {
  if (!Number.isFinite(totalMinutes) || totalMinutes < 0) return "--:--";
  const hours = Math.floor(totalMinutes / 60);
  const minutes = Math.floor(totalMinutes % 60);
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

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

  const [nowMs, setNowMs] = React.useState<number>(() => Date.now());

  React.useEffect(() => {
    if (!data) return;
    if (data.status !== "APPROVED") return;

    setNowMs(Date.now());
    const t = window.setInterval(() => setNowMs(Date.now()), 60_000);
    return () => window.clearInterval(t);
  }, [data]);

  const user = (session as unknown as { user?: Record<string, unknown> })?.user;
  const studentName =
    (typeof user?.name === "string" && user.name) ||
    `${typeof user?.firstName === "string" ? user.firstName : ""} ${
      typeof user?.lastName === "string" ? user.lastName : ""
    }`.trim();

  const status = data?.status ?? (isError ? "UNKNOWN" : "PENDING");
  const isApproved = status === "APPROVED";
  const showPendingModal = !isLoading && !isError && !isApproved;

  const {
    data: analytics,
    isLoading: analyticsLoading,
    error: analyticsError,
  } = useStudentDashboardAnalytics(isApproved);

  const nextClassStartsAt = analytics?.nextClass?.startsAt ?? null;

  const nextClassIn = React.useMemo(() => {
    if (!isApproved) return "--:--";
    if (analyticsLoading) return "--:--";
    if (!nextClassStartsAt) return "--:--";

    const startMs = new Date(nextClassStartsAt).getTime();
    const diffMinutes = Math.max(0, Math.floor((startMs - nowMs) / 60000));
    return formatMinutesToHHMM(diffMinutes);
  }, [analyticsLoading, isApproved, nextClassStartsAt, nowMs]);

  const nextClassNote = React.useMemo(() => {
    if (!isApproved) return "Schedule unlocks after approval";
    if (analyticsLoading) return "Loading schedule...";
    if (analyticsError) return "Failed to load schedule";
    if (!analytics?.nextClass) return "No classes scheduled yet";

    const row = analytics.nextClass;
    return `${row.courseCode} • ${getDayOfWeekName(row.dayOfWeek)} ${row.startTime} • ${row.location}`;
  }, [analytics, analyticsError, analyticsLoading, isApproved]);

  const feeLabel = React.useMemo(() => {
    if (!isApproved)
      return { title: "Outstanding Fees Alert", note: "Data locked" };
    if (analyticsLoading)
      return { title: "Outstanding Fees Alert", note: "Loading fees..." };
    if (analyticsError)
      return { title: "Outstanding Fees Alert", note: "Failed to load fees" };

    const outstanding = analytics?.fees.outstandingTotal ?? 0;
    const assessed = analytics?.fees.assessedTotal ?? 0;
    const paid = analytics?.fees.paidTotal ?? 0;
    const overdue = analytics?.fees.overdueCount ?? 0;
    const pending = analytics?.fees.pendingCount ?? 0;
    const parts = [
      overdue ? `${overdue} overdue` : null,
      pending ? `${pending} pending` : null,
    ].filter(Boolean);

    const progressLabel =
      assessed > 0 ? `${formatGhs(paid)} paid of ${formatGhs(assessed)}` : null;
    return {
      title: "Outstanding Fees Alert",
      note:
        outstanding > 0
          ? [progressLabel, parts.join(" • ") || "Outstanding fees"]
              .filter(Boolean)
              .join(" • ")
          : progressLabel
            ? `All clear • ${progressLabel}`
            : "No outstanding fees",
    };
  }, [analytics, analyticsError, analyticsLoading, isApproved]);

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
            <h1 className="font-display text-2xl font-semibold tracking-tight">
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
                <p className="mt-2 font-display text-4xl font-extrabold tracking-tight">
                  {nextClassIn}
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  {nextClassNote}
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
                <p className="text-sm font-semibold">{feeLabel.title}</p>
                <p className="mt-1 text-xs text-muted-foreground italic">
                  {feeLabel.note}
                </p>
              </div>
            </div>
            <div className="mt-5">
              {!isApproved ? (
                <div className="h-9 rounded-xl bg-muted/40" />
              ) : analyticsLoading ? (
                <div className="h-9 rounded-xl bg-muted/40" />
              ) : analyticsError ? (
                <div className="h-9 rounded-xl bg-muted/40" />
              ) : (
                <p className="font-display text-3xl font-extrabold tracking-tight">
                  {formatGhs(analytics?.fees.outstandingTotal ?? 0)}
                </p>
              )}
            </div>
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
              {isApproved
                ? "Latest updates relevant to you."
                : "Your feed will appear here after approval."}
            </p>
            <div className="mt-5">
              {!isApproved ? (
                <div className="h-56 rounded-2xl bg-muted/40" />
              ) : analyticsLoading ? (
                <div className="h-56 rounded-2xl bg-muted/40" />
              ) : analyticsError ? (
                <div className="h-56 rounded-2xl bg-muted/40" />
              ) : (analytics?.announcements?.length ?? 0) === 0 ? (
                <div className="h-56 rounded-2xl border border-dashed border-border flex items-center justify-center text-sm text-muted-foreground">
                  No announcements yet.
                </div>
              ) : (
                <ul className="space-y-3">
                  {(analytics?.announcements ?? []).map((a) => (
                    <li
                      key={a.id}
                      className="rounded-xl border border-border bg-background p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold truncate">
                            {a.title}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {a.excerpt || a.departmentName || "Announcement"}
                          </p>
                        </div>
                        <p className="text-[11px] text-muted-foreground whitespace-nowrap">
                          {a.publishedAt ? timeAgo(a.publishedAt) : ""}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
          <div className="rounded-2xl border border-border bg-card p-6">
            <p className="text-sm font-semibold">Upcoming Deadlines</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {isApproved
                ? "Exams and fee due dates."
                : "Deadlines unlock after approval."}
            </p>
            <div className="mt-5">
              {!isApproved ? (
                <div className="h-56 rounded-2xl bg-muted/40" />
              ) : analyticsLoading ? (
                <div className="h-56 rounded-2xl bg-muted/40" />
              ) : analyticsError ? (
                <div className="h-56 rounded-2xl bg-muted/40" />
              ) : (analytics?.deadlines?.length ?? 0) === 0 ? (
                <div className="h-56 rounded-2xl border border-dashed border-border flex items-center justify-center text-sm text-muted-foreground">
                  No deadlines found.
                </div>
              ) : (
                <ul className="space-y-3">
                  {(analytics?.deadlines ?? []).map((d) => (
                    <li
                      key={d.id}
                      className="rounded-xl border border-border bg-background p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold truncate">
                            {d.title}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {d.subtitle}
                          </p>
                        </div>
                        <p className="text-[11px] text-muted-foreground whitespace-nowrap">
                          {timeAgo(d.dueAt)}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>

      <PendingApprovalModal open={showPendingModal} studentName={studentName} />
    </div>
  );
}
