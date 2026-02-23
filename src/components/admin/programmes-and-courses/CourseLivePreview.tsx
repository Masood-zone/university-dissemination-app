"use client";

import { cn } from "@/lib/utils";

export function CourseLivePreview({
  title,
  code,
  credits,
  description,
  prerequisite,
}: {
  title: string;
  code: string;
  credits: string;
  description: string;
  prerequisite?: string | null;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-card p-5">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
          <span className="text-primary font-bold">▦</span>
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            {code || "COURSE CODE"}
          </p>
          <p className="font-semibold leading-tight">
            {title || "Course title"}
          </p>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-3 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />
          {credits || "0"} Units
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />
          Core
        </span>
      </div>

      <p
        className={cn(
          "mt-4 text-xs text-muted-foreground",
          !description && "italic",
        )}
      >
        {description ||
          "Course description will appear here as you type in the editor..."}
      </p>

      <div className="mt-5">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Prerequisites
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          {prerequisite ? (
            <span className="inline-flex items-center rounded-full bg-accent px-3 py-1 text-xs font-semibold">
              {prerequisite}
            </span>
          ) : (
            <span className="text-xs text-muted-foreground">None</span>
          )}
        </div>
      </div>
    </div>
  );
}
