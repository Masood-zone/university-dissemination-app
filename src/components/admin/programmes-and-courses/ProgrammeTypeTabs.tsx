"use client";

import { cn } from "@/lib/utils";

export type ProgrammeTypeFilter =
  | "ALL"
  | "UNDERGRADUATE"
  | "POSTGRADUATE"
  | "DIPLOMA";

const items: Array<{ key: ProgrammeTypeFilter; label: string }> = [
  { key: "ALL", label: "ALL" },
  { key: "UNDERGRADUATE", label: "UNDERGRADUATE" },
  { key: "POSTGRADUATE", label: "POSTGRADUATE" },
  { key: "DIPLOMA", label: "DIPLOMA" },
];

export function ProgrammeTypeTabs({
  value,
  onChange,
}: {
  value: ProgrammeTypeFilter;
  onChange: (value: ProgrammeTypeFilter) => void;
}) {
  return (
    <div className="inline-flex items-center gap-1 rounded-xl border border-border bg-card p-1">
      {items.map((item) => {
        const active = item.key === value;
        return (
          <button
            key={item.key}
            type="button"
            onClick={() => onChange(item.key)}
            className={cn(
              "px-4 py-2 text-[11px] font-semibold rounded-lg transition-colors",
              active
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-foreground",
            )}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
