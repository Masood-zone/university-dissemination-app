"use client";

import Link from "next/link";

import * as React from "react";

import { MaterialSymbol } from "@/components/common/MaterialSymbol";
import { EnrollmentNavbar } from "@/components/enrollment/EnrollmentNavbar";
import { Button } from "@/components/ui/button";
import { useEnrollmentStore } from "@/stores/enrollmentStore";

export default function EnrollmentLandingPage() {
  const resetDraft = useEnrollmentStore((s) => s.resetDraft);
  const applicationId = useEnrollmentStore((s) => s.draft.draftId);

  return (
    <div className="min-h-dvh bg-background">
      <EnrollmentNavbar applicationId={applicationId} />

      <main className="pt-24 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl space-y-10">
          <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Enrollment
              </p>
              <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight">
                Student Enrollment
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Complete enrollment in 4 quick steps. Progress is saved
                automatically.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                className="gap-2"
                onClick={() => resetDraft()}
              >
                <MaterialSymbol icon="restart_alt" className="text-[18px]" />
                Reset draft
              </Button>

              <Button asChild className="gap-2">
                <Link href="/enrollment/step-1">
                  <MaterialSymbol
                    icon="arrow_right_alt"
                    className="text-[18px]"
                  />
                  Start enrollment
                </Link>
              </Button>
            </div>
          </header>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <section className="rounded-2xl border border-border bg-card lg:col-span-2">
              <div className="border-b border-border p-6">
                <p className="text-sm font-semibold">What you’ll do</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Follow the guided steps and submit your application.
                </p>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {[
                    {
                      icon: "badge",
                      title: "Personal details",
                      subtitle: "Name, email & phone",
                    },
                    {
                      icon: "account_tree",
                      title: "Department",
                      subtitle: "Choose your department",
                    },
                    {
                      icon: "school",
                      title: "Programme",
                      subtitle: "Select a programme",
                    },
                    {
                      icon: "task_alt",
                      title: "Review",
                      subtitle: "Confirm and submit",
                    },
                  ].map((i) => (
                    <div
                      key={i.title}
                      className="rounded-2xl border border-border bg-background p-5"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card">
                          <MaterialSymbol
                            icon={i.icon}
                            className="text-[20px] text-primary"
                          />
                        </div>
                        <div>
                          <p className="text-sm font-semibold">{i.title}</p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {i.subtitle}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <aside className="rounded-2xl border border-border bg-muted/40 p-6">
              <div className="flex items-center gap-2">
                <MaterialSymbol
                  icon="info"
                  className="text-[18px] text-primary"
                />
                <p className="text-[11px] font-semibold uppercase tracking-wider">
                  Lightweight flow
                </p>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">
                This enrollment flow is kept simple—no document uploads
                required. You’ll receive updates through announcements and
                notifications.
              </p>

              <div className="mt-6 rounded-2xl border border-border bg-background p-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Your draft
                </p>
                <p className="mt-2 text-sm">
                  Application ID:{" "}
                  <span className="font-semibold">#{applicationId}</span>
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  We’ll use this ID to track your application.
                </p>
              </div>
            </aside>
          </div>
        </div>
      </main>
    </div>
  );
}
