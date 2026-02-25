"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

export function ThreadRow({
  title,
  subtitle,
  time,
  active,
  onClick,
  leading,
}: {
  title: string;
  subtitle?: string | null;
  time?: string | null;
  active?: boolean;
  onClick?: () => void;
  leading?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full text-left flex items-center gap-3 p-3 rounded-lg transition-colors border",
        active
          ? "bg-accent border-border"
          : "bg-transparent border-transparent hover:bg-accent/40 hover:border-border",
      )}
    >
      {leading ? (
        <div className="h-10 w-10 rounded-lg bg-muted/50 flex items-center justify-center shrink-0">
          {leading}
        </div>
      ) : null}

      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between gap-2">
          <p className="text-sm font-semibold truncate">{title}</p>
          {time ? (
            <span className="text-[10px] text-muted-foreground whitespace-nowrap">
              {time}
            </span>
          ) : null}
        </div>
        {subtitle ? (
          <p className="text-xs text-muted-foreground truncate mt-0.5">
            {subtitle}
          </p>
        ) : null}
      </div>
    </button>
  );
}
