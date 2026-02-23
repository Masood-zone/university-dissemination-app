"use client";

import Link from "next/link";

import { MaterialSymbol } from "@/components/common/MaterialSymbol";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useGetDashboardData } from "@/services/admin/dashboard/dashboard";
import type { AdminOverviewQuickAction, AdminOverviewStatCard } from "@/types";

function StatCardSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="mt-3 h-8 w-24" />
          <Skeleton className="mt-3 h-3 w-32" />
        </div>
        <Skeleton className="h-11 w-11 rounded-lg" />
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

export default function AdministratorOverviewPage() {
  const { data, isPending, isError, error } = useGetDashboardData();
  const stats: AdminOverviewStatCard[] = data?.stats ?? [];
  const quickActions: AdminOverviewQuickAction[] = data?.quickActions ?? [];

  return (
    <section className="space-y-8">
      <header>
        <h1 className="font-lexend text-2xl font-semibold tracking-tight">
          Dashboard Overview
        </h1>
        <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
          Admin metrics and quick admin actions.
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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {isPending
          ? Array.from({ length: 4 }).map((_, idx) => (
              <StatCardSkeleton key={idx} />
            ))
          : stats.map((item) => (
              <div
                key={item.label}
                className="rounded-xl border border-border bg-card p-5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      {item.label}
                    </p>
                    <p
                      className={cn(
                        "mt-2 font-lexend font-semibold",
                        item.label === "Current Semester"
                          ? "text-lg"
                          : "text-3xl",
                      )}
                    >
                      {item.value}
                    </p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {item.note}
                    </p>
                  </div>
                  <div className="inline-flex h-11 w-11 items-center justify-center rounded-lg bg-muted text-foreground">
                    <MaterialSymbol icon={item.icon} className="text-[22px]" />
                  </div>
                </div>
              </div>
            ))}
      </div>

      <section className="rounded-xl border border-border bg-card p-6">
        <div className="mb-5">
          <h2 className="font-lexend text-lg font-semibold">Quick Actions</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Common admin tasks for the portal.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
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
                    <div>
                      <p className="text-sm font-semibold">{action.title}</p>
                      <p className="text-xs text-muted-foreground">
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
    </section>
  );
}
