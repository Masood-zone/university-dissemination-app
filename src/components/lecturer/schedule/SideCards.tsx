"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";

export function VenueAvailabilityCard({
  items,
}: {
  items: Array<{ name: string; status: "Free" | "Booked" }>;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <p className="text-sm font-semibold">Venue Availability</p>
      <p className="mt-1 text-sm text-muted-foreground">
        Snapshot for this week.
      </p>

      <div className="mt-4 space-y-3">
        {items.map((it) => (
          <div key={it.name} className="flex items-center justify-between">
            <p className="text-sm text-foreground">{it.name}</p>
            <span
              className={
                it.status === "Free"
                  ? "rounded-full bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground"
                  : "rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-semibold text-destructive"
              }
            >
              {it.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function AutomationToolCard({ onRun }: { onRun: () => void }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <p className="text-sm font-semibold">Automation Tool</p>
      <p className="mt-1 text-sm text-muted-foreground">
        Automatically resolve overlaps (simulated).
      </p>
      <Button type="button" className="mt-4 w-full" onClick={onRun}>
        Run Auto-Optimizer
      </Button>
    </div>
  );
}
