"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { DatePicker } from "@/components/ui/date-picker";
import { MaterialSymbol } from "@/components/common/MaterialSymbol";
import { getApiErrorLabel } from "@/lib/api-client-error";
import { cn } from "@/lib/utils";
import {
  useCreateAcademicSession,
  useUpdateAcademicSession,
  useUpsertSessionSemester,
} from "@/services/admin/academic-sessions/sessions";
import { SemesterName } from "@prisma/client";
import type { AcademicSessionSummary } from "@/types";

type SemesterFormRow = {
  name: "FIRST" | "SECOND";
  enabled: boolean;
  startDate?: Date;
  endDate?: Date;
};

export type AcademicSessionDialogMode = "create" | "edit";

export function AcademicSessionDialog(props: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: AcademicSessionDialogMode;
  session?: AcademicSessionSummary | null;
}) {
  const { open, onOpenChange, mode, session } = props;

  const createSession = useCreateAcademicSession();
  const updateSession = useUpdateAcademicSession();
  const upsertSemester = useUpsertSessionSemester();

  const [sessionName, setSessionName] = React.useState("");
  const [sessionStart, setSessionStart] = React.useState<Date | undefined>();
  const [sessionEnd, setSessionEnd] = React.useState<Date | undefined>();
  const [setActive, setSetActive] = React.useState(true);
  const [semesterRows, setSemesterRows] = React.useState<SemesterFormRow[]>([
    { name: "FIRST", enabled: true },
    { name: "SECOND", enabled: true },
  ]);
  const [currentSemester, setCurrentSemester] =
    React.useState<SemesterFormRow["name"]>("FIRST");

  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;

    if (mode === "create") {
      // Opening the reusable dialog intentionally initializes its form state.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSessionName("");
      setSessionStart(undefined);
      setSessionEnd(undefined);
      setSetActive(true);
      setCurrentSemester("FIRST");
      setSemesterRows([
        { name: "FIRST", enabled: true },
        { name: "SECOND", enabled: true },
      ]);
      return;
    }

    if (mode === "edit" && session) {
      setSessionName(session.name);
      setSessionStart(
        session.startDate ? new Date(session.startDate) : undefined,
      );
      setSessionEnd(session.endDate ? new Date(session.endDate) : undefined);
      setSetActive(session.isActive);

      const first = session.semesters.find((s) => s.name === "FIRST");
      const second = session.semesters.find((s) => s.name === "SECOND");

      setSemesterRows([
        {
          name: "FIRST",
          enabled: Boolean(first),
          startDate: first?.startDate ? new Date(first.startDate) : undefined,
          endDate: first?.endDate ? new Date(first.endDate) : undefined,
        },
        {
          name: "SECOND",
          enabled: Boolean(second),
          startDate: second?.startDate ? new Date(second.startDate) : undefined,
          endDate: second?.endDate ? new Date(second.endDate) : undefined,
        },
      ]);

      if (
        session.currentSemester === "FIRST" ||
        session.currentSemester === "SECOND"
      ) {
        setCurrentSemester(session.currentSemester);
      } else {
        setCurrentSemester("FIRST");
      }
    }
  }, [open, mode, session]);

  const error =
    createSession.error || updateSession.error || upsertSemester.error;

  const errorLabel = React.useMemo(() => {
    if (!error) return null;
    return getApiErrorLabel(error);
  }, [error]);

  const save = async () => {
    if (!sessionName.trim()) return;

    setSaving(true);
    try {
      if (mode === "create") {
        const created = await createSession.mutateAsync({
          name: sessionName.trim(),
          startDate: sessionStart?.toISOString(),
          endDate: sessionEnd?.toISOString(),
          isActive: setActive,
          currentSemester: setActive
            ? (currentSemester as SemesterName)
            : undefined,
          semesters: semesterRows.map((s) => ({
            name: s.name as SemesterName,
            enabled: s.enabled,
            startDate: s.startDate?.toISOString(),
            endDate: s.endDate?.toISOString(),
          })),
        });

        // If created inactive, no semester writes are needed.
        // If created active, `create-session` already created enabled semesters.
        void created;
      } else if (mode === "edit" && session) {
        await updateSession.mutateAsync({
          id: session.id,
          name: sessionName.trim(),
          startDate: sessionStart?.toISOString(),
          endDate: sessionEnd?.toISOString(),
          isActive: setActive,
          currentSemester: setActive
            ? (currentSemester as SemesterName)
            : undefined,
        });

        await Promise.all(
          semesterRows.map((s) =>
            upsertSemester.mutateAsync({
              sessionId: session.id,
              name: s.name as SemesterName,
              enabled: s.enabled,
              startDate: s.startDate?.toISOString(),
              endDate: s.endDate?.toISOString(),
            }),
          ),
        );
      }

      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  const isDisabled = saving;

  return (
    <Dialog open={open} onOpenChange={(v) => !saving && onOpenChange(v)}>
      <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-225 max-h-[calc(100dvh-2rem)] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Create New Session" : "Edit Session"}
          </DialogTitle>
          <DialogDescription>
            Configure the academic session and its semesters.
          </DialogDescription>
        </DialogHeader>

        {errorLabel ? (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2">
            <div className="flex items-start gap-2">
              <MaterialSymbol
                icon="error"
                className="mt-0.5 text-[18px] text-destructive"
              />
              <div>
                <p className="text-sm font-medium text-destructive">
                  {errorLabel.message}
                </p>
                {errorLabel.code ? (
                  <p className="mt-0.5 text-xs text-destructive/80">
                    Code:{" "}
                    <span className="font-semibold">{errorLabel.code}</span>
                  </p>
                ) : null}
              </div>
            </div>
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="text-sm font-medium">Session name</label>
            <Input
              className="mt-2"
              value={sessionName}
              onChange={(e) => setSessionName(e.target.value)}
              placeholder="e.g. 2024/2025 Academic Year"
              disabled={isDisabled}
            />
          </div>

          <div>
            <label className="text-sm font-medium">Start date</label>
            <div className="mt-2">
              <DatePicker
                value={sessionStart}
                onChange={setSessionStart}
                placeholder="Pick start date"
                buttonClassName="w-full"
                disabled={isDisabled}
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">End date</label>
            <div className="mt-2">
              <DatePicker
                value={sessionEnd}
                onChange={setSessionEnd}
                placeholder="Pick end date"
                buttonClassName="w-full"
                disabled={isDisabled}
              />
            </div>
          </div>

          <div className="sm:col-span-2 flex items-center justify-between rounded-lg border border-border bg-muted/40 p-3">
            <div>
              <p className="text-sm font-semibold">Set session active</p>
              <p className="text-xs text-muted-foreground">
                Only one academic session can be active.
              </p>
            </div>
            <Switch
              checked={setActive}
              onCheckedChange={setSetActive}
              disabled={isDisabled}
            />
          </div>
        </div>

        <div className="mt-2 rounded-xl border border-border">
          <div className="border-b border-border px-4 py-3">
            <p className="text-sm font-semibold">Semesters setup</p>
            <p className="text-xs text-muted-foreground">
              Enable semesters and set their dates.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  <th className="px-4 py-3">Include</th>
                  <th className="px-4 py-3">Semester</th>
                  <th className="px-4 py-3">Start date</th>
                  <th className="px-4 py-3">End date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {semesterRows.map((sem) => {
                  const isEnabled = sem.enabled;
                  return (
                    <tr key={sem.name} className="align-top">
                      <td className="px-4 py-4">
                        <input
                          type="checkbox"
                          checked={sem.enabled}
                          disabled={isDisabled}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            setSemesterRows((prev) =>
                              prev.map((r) =>
                                r.name === sem.name
                                  ? { ...r, enabled: checked }
                                  : r,
                              ),
                            );
                          }}
                          className="h-4 w-4"
                        />
                      </td>
                      <td className="px-4 py-4">
                        <div>
                          <p className="font-semibold">
                            {sem.name === "FIRST" ? "First" : "Second"} Semester
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {sem.name}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <DatePicker
                          value={sem.startDate}
                          onChange={(d) => {
                            setSemesterRows((prev) =>
                              prev.map((r) =>
                                r.name === sem.name
                                  ? { ...r, startDate: d }
                                  : r,
                              ),
                            );
                          }}
                          placeholder="Start"
                          buttonClassName={cn(
                            "w-full",
                            !isEnabled && "opacity-50",
                          )}
                          disabled={isDisabled || !isEnabled}
                        />
                      </td>
                      <td className="px-4 py-4">
                        <DatePicker
                          value={sem.endDate}
                          onChange={(d) => {
                            setSemesterRows((prev) =>
                              prev.map((r) =>
                                r.name === sem.name ? { ...r, endDate: d } : r,
                              ),
                            );
                          }}
                          placeholder="End"
                          buttonClassName={cn(
                            "w-full",
                            !isEnabled && "opacity-50",
                          )}
                          disabled={isDisabled || !isEnabled}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {setActive ? (
          <div className="mt-3 rounded-xl border border-border bg-muted/40 p-3">
            <p className="text-sm font-semibold">Current semester</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Selected semester becomes the active semester when session is
              active.
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {(["FIRST", "SECOND"] as const).map((sem) => {
                const selected = currentSemester === sem;
                return (
                  <button
                    key={sem}
                    type="button"
                    disabled={isDisabled}
                    onClick={() => setCurrentSemester(sem)}
                    className={cn(
                      "flex items-center justify-between rounded-lg border px-3 py-2 text-left text-sm",
                      selected
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-background",
                    )}
                  >
                    <span className="font-semibold">
                      {sem === "FIRST" ? "First" : "Second"}
                    </span>
                    {selected ? (
                      <MaterialSymbol icon="check" className="text-[18px]" />
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}

        <DialogFooter>
          <Button
            variant="outline"
            type="button"
            onClick={() => onOpenChange(false)}
            disabled={isDisabled}
          >
            Cancel
          </Button>
          <Button type="button" onClick={save} disabled={isDisabled}>
            {saving
              ? mode === "create"
                ? "Creating..."
                : "Saving..."
              : mode === "create"
                ? "Create Session"
                : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
