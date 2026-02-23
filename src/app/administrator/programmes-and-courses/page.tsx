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
import type { ProgrammeListItem } from "@/types";

const mockProgrammes: ProgrammeListItem[] = [
  {
    id: "p-1",
    name: "BSc. Information Technology Education",
    code: "BSc-ITE",
    departmentName: "Information Technology Education",
    awardType: "UNDERGRADUATE",
    awardTypeLabel: "Degree",
    durationLabel: "4 Years",
    activeCourses: 42,
  },
  {
    id: "p-2",
    name: "B.Ed. Mathematics Education",
    code: "BEd-MAT",
    departmentName: "Mathematical Sciences",
    awardType: "UNDERGRADUATE",
    awardTypeLabel: "Degree",
    durationLabel: "4 Years",
    activeCourses: 38,
  },
  {
    id: "p-3",
    name: "Diploma in Fashion Design",
    code: "DIP-FDT",
    departmentName: "Fashion Design & Textiles",
    awardType: "DIPLOMA",
    awardTypeLabel: "Diploma",
    durationLabel: "2 Years",
    activeCourses: 18,
  },
  {
    id: "p-4",
    name: "M.Phil Electrical Engineering",
    code: "MPH-ELE",
    departmentName: "Electrical Engineering",
    awardType: "POSTGRADUATE",
    awardTypeLabel: "Masters",
    durationLabel: "2 Years",
    activeCourses: 12,
  },
];

export default function ProgrammesAndCoursesPage() {
  const [query, setQuery] = React.useState("");
  const [filter, setFilter] = React.useState<ProgrammeTypeFilter>("ALL");

  const rows = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return mockProgrammes.filter((p) => {
      if (filter !== "ALL" && p.awardType !== filter) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        p.code.toLowerCase().includes(q) ||
        p.departmentName.toLowerCase().includes(q)
      );
    });
  }, [query, filter]);

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

      <ProgrammeTable programmes={rows} />
    </section>
  );
}
