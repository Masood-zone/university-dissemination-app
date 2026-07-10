"use client";

import * as React from "react";

import { MaterialSymbol } from "@/components/common/MaterialSymbol";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  AcademicSessionDialog,
  type AcademicSessionDialogMode,
} from "@/components/admin/academic-sessions/AcademicSessionDialog";
import { cn } from "@/lib/utils";
import {
  useGetAcademicSessions,
  useSetCurrentSemester,
  useUpdateAcademicSession,
} from "@/services/admin/academic-sessions/sessions";
import type { AcademicSessionSummary } from "@/types";

function StatusPill({ isActive }: { isActive: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold",
        isActive
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border-border bg-muted text-muted-foreground",
      )}
    >
      {isActive ? "ACTIVE" : "INACTIVE"}
    </span>
  );
}

export default function AcademicSessionsPage() {
  const [query, setQuery] = React.useState("");
  const { data: sessionsData, isLoading: sessionsLoading } =
    useGetAcademicSessions();
  const updateSession = useUpdateAcademicSession();
  const setCurrentSemesterMutation = useSetCurrentSemester();

  const sessions = React.useMemo(
    () => sessionsData?.sessions ?? [],
    [sessionsData?.sessions],
  );
  const activeSession =
    sessionsData?.activeSession ?? sessions.find((s) => s.isActive) ?? null;
  const activeSemesterName =
    sessionsData?.activeSemesterName ?? activeSession?.currentSemester ?? null;

  const dateFormatter = React.useMemo(
    () =>
      new Intl.DateTimeFormat("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
    [],
  );
  const formatDate = React.useCallback(
    (value?: string | null) => {
      if (!value) return "—";
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) return "—";
      return dateFormatter.format(date);
    },
    [dateFormatter],
  );

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return sessions;
    return sessions.filter((r) => r.name.toLowerCase().includes(q));
  }, [query, sessions]);

  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [dialogMode, setDialogMode] =
    React.useState<AcademicSessionDialogMode>("create");
  const [editingSession, setEditingSession] =
    React.useState<AcademicSessionSummary | null>(null);

  const [currentSemester, setCurrentSemester] = React.useState<
    "FIRST" | "SECOND"
  >("FIRST");

  React.useEffect(() => {
    if (activeSemesterName === "FIRST" || activeSemesterName === "SECOND") {
      setCurrentSemester(activeSemesterName);
    }
  }, [activeSemesterName]);

  const openCreate = () => {
    setDialogMode("create");
    setEditingSession(null);
    setDialogOpen(true);
  };

  const openEdit = (row: AcademicSessionSummary) => {
    setDialogMode("edit");
    setEditingSession(row);
    setDialogOpen(true);
  };

  const toggleVisibility = async (session: AcademicSessionSummary) => {
    try {
      const nextActive = !session.isActive;
      await updateSession.mutateAsync({
        id: session.id,
        isActive: nextActive,
        currentSemester: nextActive
          ? (session.currentSemester ?? "FIRST")
          : undefined,
      });
    } catch {
      // handled by mutation error state
    }
  };

  return (
    <section className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-xl font-semibold">
            Academic Sessions Management
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            View and manage academic years and their semesters.
          </p>
        </div>

        <Button onClick={openCreate} className="gap-2">
          <MaterialSymbol icon="add" className="text-[18px]" />
          Create New Session
        </Button>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <section className="lg:col-span-2 rounded-xl border border-border bg-card">
          <div className="flex flex-col gap-3 border-b border-border p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold">
                Historical & Current Sessions
              </p>
              <p className="text-xs text-muted-foreground">
                View and manage all academic years
              </p>
            </div>
            <div className="relative">
              <MaterialSymbol
                icon="search"
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-muted-foreground"
              />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search sessions..."
                className="pl-9 w-full sm:w-64"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  <th className="px-5 py-3">Session Name</th>
                  <th className="px-5 py-3">Start Date</th>
                  <th className="px-5 py-3">End Date</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {sessionsLoading ? (
                  <tr>
                    <td
                      className="px-5 py-8 text-center text-sm text-muted-foreground"
                      colSpan={5}
                    >
                      Loading sessions...
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td
                      className="px-5 py-8 text-center text-sm text-muted-foreground"
                      colSpan={5}
                    >
                      No sessions found.
                    </td>
                  </tr>
                ) : (
                  filtered.map((row) => (
                    <tr key={row.id} className="hover:bg-accent/40">
                      <td className="px-5 py-4">
                        <p className="font-semibold leading-tight">
                          {row.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Academic Year
                        </p>
                      </td>
                      <td className="px-5 py-4 text-muted-foreground">
                        {formatDate(row.startDate)}
                      </td>
                      <td className="px-5 py-4 text-muted-foreground">
                        {formatDate(row.endDate)}
                      </td>
                      <td className="px-5 py-4">
                        <StatusPill isActive={row.isActive} />
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            aria-label="Edit session"
                            onClick={() => openEdit(row)}
                          >
                            <MaterialSymbol
                              icon="edit"
                              className="text-[18px]"
                            />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            aria-label="Toggle session visibility"
                            onClick={() => toggleVisibility(row)}
                            disabled={updateSession.isPending}
                          >
                            <MaterialSymbol
                              icon="visibility"
                              className="text-[18px]"
                            />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <aside className="space-y-6">
          <div className="rounded-xl border border-border bg-primary text-primary-foreground p-5 relative overflow-hidden">
            <div className="relative z-10">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-primary-foreground/80">
                Current Active Session
              </p>
              <p className="mt-3 font-display text-2xl font-semibold">
                {activeSession?.name ?? "Not set"}
              </p>
              <p className="mt-1 text-xs text-primary-foreground/80">
                {activeSession
                  ? `Current semester: ${
                      currentSemester === "SECOND" ? "Second" : "First"
                    } Semester`
                  : "No active session"}
              </p>
            </div>
            <MaterialSymbol
              icon="calendar_month"
              className="absolute -bottom-4 -right-4 text-[120px] text-primary-foreground/10"
            />
          </div>

          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-semibold">Manage Semesters</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Toggle current semester for active session
                </p>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              {(["FIRST", "SECOND"] as const).map((sem, idx) => {
                const checked = currentSemester === sem;
                return (
                  <div
                    key={sem}
                    className={cn(
                      "flex items-center justify-between rounded-xl border border-border p-4",
                      checked ? "bg-accent" : "bg-background",
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "flex h-9 w-9 items-center justify-center rounded-lg border",
                          checked
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-muted text-foreground border-border",
                        )}
                      >
                        <span className="text-sm font-semibold">{idx + 1}</span>
                      </div>
                      <div>
                        <p className="text-sm font-semibold">
                          {sem === "FIRST"
                            ? "First Semester"
                            : "Second Semester"}
                        </p>
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                          {checked ? "Currently active" : "Scheduled"}
                        </p>
                      </div>
                    </div>

                    <Switch
                      checked={checked}
                      onCheckedChange={(v) => {
                        if (!v) return;
                        if (!activeSession) return;
                        setCurrentSemesterMutation.mutate(
                          {
                            sessionId: activeSession.id,
                            semesterName: sem,
                          },
                          {
                            onSuccess: () => {
                              setCurrentSemester(sem);
                            },
                          },
                        );
                      }}
                      aria-label={`Set ${sem} semester active`}
                      disabled={
                        !activeSession || setCurrentSemesterMutation.isPending
                      }
                    />
                  </div>
                );
              })}
            </div>

            <p className="mt-4 text-[10px] text-muted-foreground">
              <span className="font-semibold text-destructive">NOTE:</span>{" "}
              Toggling a semester will update system-wide access for
              registration and grading modules.
            </p>
          </div>
        </aside>
      </div>

      <AcademicSessionDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        mode={dialogMode}
        session={editingSession}
      />
    </section>
  );
}
