"use client";

import Link from "next/link";
import * as React from "react";

import { MaterialSymbol } from "@/components/common/MaterialSymbol";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getApiErrorLabel } from "@/lib/api-client-error";
import { authClient } from "@/lib/auth-client";
import { getDayOfWeekName, timeAgo } from "@/lib/utils";
import { useLecturerDashboardAnalytics } from "@/services/lecturer/dashboard/dashboard";

function StatCard({
  label,
  value,
  note,
  icon,
  loading,
}: {
  label: string;
  value: string;
  note: string;
  icon: string;
  loading?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {label}
          </p>
          {loading ? (
            <Skeleton className="mt-3 h-9 w-24" />
          ) : (
            <p className="mt-2 font-lexend text-3xl font-semibold tracking-tight">
              {value}
            </p>
          )}
          <p className="mt-2 text-xs text-muted-foreground">{note}</p>
        </div>

        <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-muted/40">
          <MaterialSymbol
            icon={icon}
            className="text-[20px] text-muted-foreground"
          />
        </div>
      </div>
    </div>
  );
}

export default function LecturerDashboardPage() {
  const query = useLecturerDashboardAnalytics();
  const errorLabel = query.error ? getApiErrorLabel(query.error) : null;
  const errorText = errorLabel
    ? errorLabel.code
      ? `${errorLabel.message} (${errorLabel.code})`
      : errorLabel.message
    : null;

  const { data: session } = authClient.useSession();
  const user = (session as unknown as { user?: Record<string, unknown> })?.user;
  const lecturerName =
    (typeof user?.name === "string" && user.name) ||
    `${typeof user?.firstName === "string" ? user.firstName : ""} ${
      typeof user?.lastName === "string" ? user.lastName : ""
    }`.trim();

  const summary = query.data?.summary;
  const coursePreview = query.data?.assignedCoursesPreview ?? [];
  const upcomingSchedule = query.data?.upcomingSchedule ?? [];
  const recentAnnouncements = query.data?.recentAnnouncements ?? [];

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Lecturer Portal
          </p>
          <h1 className="font-lexend text-2xl font-semibold tracking-tight">
            Overview
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {lecturerName ? `Welcome back, ${lecturerName}` : "Welcome back"}
          </p>
        </div>

        <Button asChild variant="outline">
          <Link href="/lecturer/announcements">
            <MaterialSymbol icon="campaign" className="text-[18px]" />
            Post Announcement
          </Link>
        </Button>
      </header>

      {errorText ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4">
          <p className="text-sm font-semibold">Failed to load dashboard</p>
          <p className="mt-1 text-sm text-muted-foreground">{errorText}</p>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Assigned Courses"
          value={String(summary?.assignedCourses ?? 0)}
          note="Active course assignments"
          icon="menu_book"
          loading={query.isPending}
        />
        <StatCard
          label="Total Students"
          value={String(summary?.totalStudents ?? 0)}
          note="Enrolled across your courses"
          icon="groups"
          loading={query.isPending}
        />
        <StatCard
          label="Hours / Week"
          value={
            summary?.weeklyHours != null ? `${summary.weeklyHours}h` : "0h"
          }
          note="Based on timetable entries"
          icon="schedule"
          loading={query.isPending}
        />
        <StatCard
          label="My Announcements"
          value={String(summary?.myAnnouncements ?? 0)}
          note="Published by you"
          icon="campaign"
          loading={query.isPending}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <section className="rounded-2xl border border-border bg-card p-6 lg:col-span-2">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold">Assigned Courses</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Quick view of your current assignments.
              </p>
            </div>
            <Button asChild variant="ghost">
              <Link href="/lecturer/courses">View all</Link>
            </Button>
          </div>

          <div className="mt-5">
            {query.isPending ? (
              <div className="space-y-3">
                <Skeleton className="h-16 w-full rounded-xl" />
                <Skeleton className="h-16 w-full rounded-xl" />
              </div>
            ) : coursePreview.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border p-6 text-sm text-muted-foreground">
                No assigned courses yet.
              </div>
            ) : (
              <ul className="space-y-3">
                {coursePreview.map((c) => (
                  <li
                    key={c.offeringId}
                    className="rounded-xl border border-border bg-background p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="rounded-full bg-primary/10 px-2 py-1 text-[11px] font-semibold text-primary">
                            {c.courseCode}
                          </span>
                          <span className="text-[11px] text-muted-foreground">
                            {c.credits} credits
                          </span>
                        </div>
                        <p className="mt-2 text-sm font-semibold truncate">
                          {c.courseTitle}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {c.sessionName} • {c.semesterName} • {c.enrolledCount}{" "}
                          students
                        </p>
                      </div>
                      <MaterialSymbol
                        icon="chevron_right"
                        className="text-muted-foreground"
                      />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card p-6">
          <p className="text-sm font-semibold">Upcoming Schedule</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Next classes from your timetable.
          </p>

          <div className="mt-5">
            {query.isPending ? (
              <div className="space-y-3">
                <Skeleton className="h-14 w-full rounded-xl" />
                <Skeleton className="h-14 w-full rounded-xl" />
                <Skeleton className="h-14 w-full rounded-xl" />
              </div>
            ) : upcomingSchedule.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border p-6 text-sm text-muted-foreground">
                No timetable entries found.
              </div>
            ) : (
              <ul className="space-y-3">
                {upcomingSchedule.map((row) => (
                  <li
                    key={row.id}
                    className="rounded-xl border border-border bg-background p-4"
                  >
                    <p className="text-sm font-semibold truncate">
                      {row.courseCode}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {getDayOfWeekName(row.dayOfWeek)} • {row.startTime}-
                      {row.endTime}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground truncate">
                      {row.location}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>

      <section className="rounded-2xl border border-border bg-card p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold">Recent Announcements</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Latest announcements you published.
            </p>
          </div>
          <Button asChild variant="ghost">
            <Link href="/lecturer/announcements">Manage</Link>
          </Button>
        </div>

        <div className="mt-5">
          {query.isPending ? (
            <div className="space-y-3">
              <Skeleton className="h-16 w-full rounded-xl" />
              <Skeleton className="h-16 w-full rounded-xl" />
            </div>
          ) : recentAnnouncements.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border p-6 text-sm text-muted-foreground">
              No announcements yet.
            </div>
          ) : (
            <ul className="space-y-3">
              {recentAnnouncements.map((a) => (
                <li
                  key={a.id}
                  className="rounded-xl border border-border bg-background p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate">
                        {a.title}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground truncate">
                        {a.courseCode ? `${a.courseCode} • ` : ""}
                        {a.excerpt || "Announcement"}
                      </p>
                    </div>
                    <p className="text-[11px] text-muted-foreground whitespace-nowrap">
                      {timeAgo(a.publishedAt ?? a.createdAt)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
