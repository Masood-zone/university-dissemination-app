"use client";

import Link from "next/link";

import * as React from "react";

import { MaterialSymbol } from "@/components/common/MaterialSymbol";
import { ProgrammeTable } from "@/components/admin/programmes-and-courses/ProgrammeTable";
import {
  ProgrammeTypeTabs,
  type ProgrammeTypeFilter,
} from "@/components/admin/programmes-and-courses/ProgrammeTypeTabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { getApiErrorLabel } from "@/lib/api-client-error";
import { useGetProgrammes } from "@/services/admin/programmes-and-courses/programmes";
import type { ProgrammeListItem } from "@/types";

export default function ProgrammesAndCoursesPage() {
  const [query, setQuery] = React.useState("");
  const [filter, setFilter] = React.useState<ProgrammeTypeFilter>("ALL");

  const programmesQuery = useGetProgrammes();
  const programmes = programmesQuery.data ?? [];

  const rows = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return programmes.filter((p) => {
      if (filter !== "ALL" && p.awardType !== filter) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        p.code.toLowerCase().includes(q) ||
        p.departmentName.toLowerCase().includes(q)
      );
    });
  }, [query, filter, programmes]);

  return (
    <section className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-lexend text-xl font-semibold">
            Academic Programme List
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage and review all registered academic programmes and their
            course mappings.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative">
            <MaterialSymbol
              icon="search"
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-muted-foreground"
            />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search programmes..."
              className="pl-9 w-full sm:w-72"
            />
          </div>

          <Button asChild className="gap-2">
            <Link href="/administrator/programmes-and-courses/add-programme">
              <MaterialSymbol icon="add" className="text-[18px]" />
              New Programme
            </Link>
          </Button>
        </div>
      </header>

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <ProgrammeTypeTabs value={filter} onChange={setFilter} />
        <p className="text-xs text-muted-foreground">
          Showing {Math.min(rows.length, 5)} of {rows.length} programmes
        </p>
      </div>

      {programmesQuery.isLoading ? (
        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="space-y-4">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      ) : programmesQuery.isError ? (
        <div className="rounded-2xl border border-border bg-card p-6">
          <p className="text-sm font-semibold">Unable to load programmes</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {getApiErrorLabel(programmesQuery.error).message}
          </p>
        </div>
      ) : (
        <ProgrammeTable programmes={rows as ProgrammeListItem[]} />
      )}
    </section>
  );
}
