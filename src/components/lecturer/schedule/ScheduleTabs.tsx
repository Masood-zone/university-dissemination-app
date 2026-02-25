"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

export type ScheduleTabKey = "TIMETABLE" | "EXAMS" | "LOAD";

export function ScheduleTabs({
  value,
  onChange,
}: {
  value: ScheduleTabKey;
  onChange: (value: ScheduleTabKey) => void;
}) {
  const items: Array<{ key: ScheduleTabKey; label: string }> = [
    { key: "TIMETABLE", label: "Lecture Timetable" },
    { key: "EXAMS", label: "Exam Coordination" },
    { key: "LOAD", label: "Staff Load Balancing" },
  ];

  return (
    <div className="border-b border-border">
      <nav className="flex gap-6">
        {items.map((it) => (
          <button
            key={it.key}
            type="button"
            onClick={() => onChange(it.key)}
            className={cn(
              "pb-3 text-sm font-medium transition-colors",
              value === it.key
                ? "text-foreground border-b-2 border-primary"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {it.label}
          </button>
        ))}
      </nav>
    </div>
  );
}
