"use client";

import Link from "next/link";

import { MaterialSymbol } from "@/components/common/MaterialSymbol";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn, timeAgo } from "@/lib/utils";
import { useGetDepartmentAdminDashboardData } from "@/services/department-admin/dashboard/dashboard";
import type {
  DepartmentAdminActivityItem,
  DepartmentAdminOverviewQuickAction,
  DepartmentAdminOverviewStatCard,
} from "@/types";

function StatCardSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <Skeleton className="h-3 w-32" />
          <Skeleton className="mt-3 h-8 w-24" />
          <Skeleton className="mt-3 h-3 w-40" />
        </div>
        <Skeleton className="h-12 w-12 rounded-xl" />
      </div>
    </div>
  );
}

function ActivitySkeleton() {
  return (
    <div className="flex items-start gap-4 rounded-xl border border-border bg-background p-4">
      <Skeleton className="h-10 w-10 rounded-full" />
      <div className="flex-1">
        <Skeleton className="h-4 w-56" />
        <Skeleton className="mt-2 h-3 w-80" />
        <Skeleton className="mt-2 h-3 w-24" />
      </div>
    </div>
  );
}

function QuickActionSkeleton() {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-border bg-background p-4">
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-10 rounded-lg" />
        <div>
          <Skeleton className="h-4 w-32" />
          <Skeleton className="mt-2 h-3 w-44" />
        </div>
      </div>
      <Skeleton className="h-5 w-5 rounded" />
    </div>
  );
}

function CalendarCard({
  title,
  description,
  startDate,
  endDate,
}: {
  title: string;
  description: string;
  startDate: string;
  endDate: string;
}) {
  const formatter = new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  const rangeLabel = `${formatter.format(new Date(startDate))} – ${formatter.format(
    new Date(endDate),
  )}`;

  return (
    <div className="rounded-xl bg-primary p-6 text-primary-foreground">
      <h3 className="font-display text-lg font-semibold">Academic Calendar</h3>
      <p className="mt-3 text-sm font-semibold">{title}</p>
      <p className="mt-1 text-sm text-primary-foreground/80">{description}</p>
      <p className="mt-4 text-xs text-primary-foreground/80">{rangeLabel}</p>

      <Button type="button" variant="secondary" className="mt-5" disabled>
        View Calendar
      </Button>
    </div>
  );
}

function ActivityItem({ item }: { item: DepartmentAdminActivityItem }) {
  return (
    <div className="flex items-start gap-4 border-t border-border px-5 py-4 first:border-t-0">
      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-foreground">
        <MaterialSymbol icon={item.icon} className="text-[18px]" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold truncate">{item.title}</p>
        <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
          {item.description}
        </p>
        <p className="mt-2 text-[11px] text-muted-foreground">
          {timeAgo(item.createdAt)}
        </p>
      </div>
    </div>
  );
}

export default function DepartmentAdminOverviewPage() {
  const { data, isPending, isError, error } =
    useGetDepartmentAdminDashboardData();

  const stats: DepartmentAdminOverviewStatCard[] = data?.stats ?? [];
  const activities: DepartmentAdminActivityItem[] = data?.activities ?? [];
  const quickActions: DepartmentAdminOverviewQuickAction[] =
    data?.quickActions ?? [];

  return (
    <section className="space-y-8">
      <header>
        <h1 className="font-display text-2xl font-semibold tracking-tight">
          Department Admin Dashboard Overview
        </h1>
        <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
          Key department analytics and daily actions.
        </p>
      </header>

      {isError ? (
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-sm font-semibold">Failed to load dashboard</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {error instanceof Error
              ? error.message
              : "Please refresh and try again."}
          </p>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {isPending
          ? Array.from({ length: 3 }).map((_, idx) => (
              <StatCardSkeleton key={idx} />
            ))
          : stats.map((item) => (
              <div
                key={item.label}
                className="rounded-xl border border-border bg-card p-6"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-muted-foreground">
                      {item.label}
                    </p>
                    <p className="mt-2 font-display text-3xl font-semibold tracking-tight">
                      {item.value}
                    </p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {item.note}
                    </p>
                  </div>

                  <div className="flex flex-col items-end gap-3">
                    {item.badge ? (
                      <span
                        className={cn(
                          "rounded-full border border-border bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground",
                          item.label === "Department Courses"
                            ? "bg-primary/10 text-primary border-primary/20"
                            : null,
                        )}
                      >
                        {item.badge}
                      </span>
                    ) : (
                      <span className="h-7" />
                    )}
                    <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-muted text-foreground">
                      <MaterialSymbol
                        icon={item.icon}
                        className="text-[22px]"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <section className="rounded-xl border border-border bg-card lg:col-span-2">
          <div className="flex items-center justify-between gap-4 border-b border-border px-5 py-4">
            <div className="flex items-center gap-2">
              <MaterialSymbol icon="history" className="text-[18px]" />
              <h2 className="font-display text-base font-semibold">
                Department Activity Feed
              </h2>
            </div>
            <Link
              href="/department-admin/announcements"
              className="text-sm font-semibold text-primary hover:underline"
            >
              View All
            </Link>
          </div>

          {isPending ? (
            <div className="space-y-3 p-5">
              {Array.from({ length: 3 }).map((_, idx) => (
                <ActivitySkeleton key={idx} />
              ))}
            </div>
          ) : activities.length === 0 ? (
            <div className="p-6 text-sm text-muted-foreground">
              No recent department activity.
            </div>
          ) : (
            <div>
              {activities.map((item) => (
                <ActivityItem key={item.id} item={item} />
              ))}
            </div>
          )}
        </section>

        <div className="space-y-6">
          <section className="rounded-xl border border-border bg-card p-6">
            <div className="mb-5">
              <h2 className="font-display text-lg font-semibold">
                Quick Actions
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Common tasks for department admins.
              </p>
            </div>

            <div className="space-y-3">
              {isPending
                ? Array.from({ length: 4 }).map((_, idx) => (
                    <QuickActionSkeleton key={idx} />
                  ))
                : quickActions.map((action) => (
                    <Link
                      key={action.title}
                      href={action.href}
                      className="group flex items-center justify-between gap-4 rounded-lg border border-border bg-background p-4 hover:bg-accent"
                    >
                      <div className="flex items-center gap-4">
                        <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-foreground">
                          <MaterialSymbol
                            icon={action.icon}
                            className="text-[20px]"
                          />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold truncate">
                            {action.title}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {action.description}
                          </p>
                        </div>
                      </div>
                      <MaterialSymbol
                        icon="chevron_right"
                        className="text-[20px] text-muted-foreground"
                      />
                    </Link>
                  ))}
            </div>
          </section>

          {isPending ? (
            <div className="rounded-xl border border-border bg-card p-6">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="mt-4 h-4 w-56" />
              <Skeleton className="mt-2 h-4 w-64" />
              <Skeleton className="mt-6 h-9 w-32" />
            </div>
          ) : data?.calendar ? (
            <CalendarCard
              title={data.calendar.title}
              description={data.calendar.description}
              startDate={data.calendar.startDate}
              endDate={data.calendar.endDate}
            />
          ) : (
            <div className="rounded-xl border border-border bg-card p-6">
              <h3 className="font-display text-lg font-semibold">
                Academic Calendar
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                No upcoming calendar events.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
