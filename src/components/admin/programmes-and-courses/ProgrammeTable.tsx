"use client";

import Link from "next/link";

import { MaterialSymbol } from "@/components/common/MaterialSymbol";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ProgrammeListItem } from "@/types";

function initials(name: string) {
  const parts = name.split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? "P";
  const last = parts[parts.length - 1]?.[0] ?? "";
  return (first + last).toUpperCase();
}

export function ProgrammeTable({
  programmes,
}: {
  programmes: ProgrammeListItem[];
}) {
  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground border-b border-border">
              <th className="px-6 py-4">Programme Details</th>
              <th className="px-6 py-4">Code</th>
              <th className="px-6 py-4">Department</th>
              <th className="px-6 py-4">Active Courses</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {programmes.map((p) => (
              <tr key={p.id} className="hover:bg-accent/40">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "h-10 w-10 rounded-xl border border-border bg-accent flex items-center justify-center font-semibold",
                      )}
                    >
                      {initials(p.name)}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold leading-tight truncate">
                        {p.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {p.awardTypeLabel} • {p.durationLabel}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center rounded-md bg-muted px-2 py-1 text-xs font-semibold">
                    {p.code}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <p className="text-sm font-medium">{p.departmentName}</p>
                </td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                    {p.activeCourses} Courses
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex justify-end gap-2">
                    <Button asChild variant="outline" size="sm" className="gap-2">
                      <Link
                        href={`/administrator/programmes-and-courses/add-course?programmeId=${encodeURIComponent(
                          p.id,
                        )}`}
                      >
                        <MaterialSymbol icon="add" className="text-[18px]" />
                        Add Course
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label="More actions"
                      type="button"
                    >
                      <MaterialSymbol icon="more_vert" className="text-[18px]" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
