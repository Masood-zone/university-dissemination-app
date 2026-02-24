"use client";

import { useRouter } from "next/navigation";

import * as React from "react";

import { EnrollmentShell } from "@/components/enrollment/EnrollmentShell";
import { MaterialSymbol } from "@/components/common/MaterialSymbol";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { authClient } from "@/lib/auth-client";
import { getApiErrorLabel } from "@/lib/api-client-error";
import {
  useGetEnrollmentDepartments,
  useGetEnrollmentProgrammes,
  useSubmitEnrollment,
} from "@/services/enrollment/enrollment";
import { useEnrollmentStore } from "@/stores/enrollmentStore";
import { toast } from "sonner";

export default function EnrollmentStep4Page() {
  const router = useRouter();
  const draft = useEnrollmentStore((s) => s.draft);
  const setAcceptedDeclaration = useEnrollmentStore(
    (s) => s.setAcceptedDeclaration,
  );
  const resetDraft = useEnrollmentStore((s) => s.resetDraft);

  const submitMutation = useSubmitEnrollment();
  const { data: departments } = useGetEnrollmentDepartments();
  const { data: programmes } = useGetEnrollmentProgrammes(
    draft.academic.departmentId || null,
  );

  const [confirmOpen, setConfirmOpen] = React.useState(false);

  const departmentName =
    (departments ?? []).find((d) => d.id === draft.academic.departmentId)
      ?.name ?? "—";
  const programmeName =
    (programmes ?? []).find((p) => p.id === draft.academic.programmeId)?.name ??
    "—";

  const canSubmit =
    Boolean(draft.personal.firstName.trim()) &&
    Boolean(draft.personal.lastName.trim()) &&
    Boolean(draft.personal.email.trim()) &&
    Boolean(draft.personal.phone.trim()) &&
    Boolean(draft.academic.departmentId) &&
    Boolean(draft.academic.programmeId) &&
    draft.acceptedDeclaration &&
    !submitMutation.isPending;

  const errorLabel = React.useMemo(() => {
    if (!submitMutation.error) return null;
    return getApiErrorLabel(submitMutation.error);
  }, [submitMutation.error]);

  const submit = async (): Promise<boolean> => {
    if (!canSubmit) return false;

    try {
      const result = await submitMutation.mutateAsync({
        draftId: draft.draftId,
        personal: {
          firstName: draft.personal.firstName,
          lastName: draft.personal.lastName,
          otherNames: draft.personal.otherNames,
          email: draft.personal.email,
          phone: draft.personal.phone,
          dateOfBirth: draft.personal.dateOfBirth || undefined,
          gender: draft.personal.gender || undefined,
          nationality: draft.personal.nationality || undefined,
          address: draft.personal.address || undefined,
        },
        academic: {
          departmentId: draft.academic.departmentId,
          programmeId: draft.academic.programmeId,
          sessionId: draft.academic.sessionId || undefined,
          level: draft.academic.level || undefined,
        },
        acceptedDeclaration: draft.acceptedDeclaration,
      });

      if (result.accountCreated && result.temporaryPassword) {
        const { error } = await authClient.signIn.email({
          email: draft.personal.email.trim(),
          password: result.temporaryPassword,
          callbackURL: "/student/dashboard",
          rememberMe: true,
        });

        if (error) {
          toast.success(
            `Submitted: ${result.applicationNo}. Please log in to continue.`,
          );
          router.push("/login");
          return true;
        }

        resetDraft();
        router.push("/student/dashboard");
        return true;
      }

      toast.success(`Submitted: ${result.applicationNo}`);
      resetDraft();
      router.push("/login");
      return true;
    } catch {
      // handled by mutation state
      return false;
    }
  };

  return (
    <EnrollmentShell
      step={4}
      title="Enrollment Step 4: Review & Submit"
      subtitle="Finalize your application by reviewing your selection summary and confirming submission."
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4">
            <div className="rounded-2xl border border-border bg-muted/40 p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold">Personal details</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Ensure your information is accurate.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => router.push("/enrollment/step-1")}
                >
                  <MaterialSymbol icon="edit" className="text-[18px]" />
                  Edit
                </Button>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 text-sm">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground">
                    Full name
                  </p>
                  <p className="font-semibold">
                    {draft.personal.firstName} {draft.personal.otherNames}{" "}
                    {draft.personal.lastName}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground">
                    Email
                  </p>
                  <p className="font-semibold">{draft.personal.email || "—"}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground">
                    Phone
                  </p>
                  <p className="font-semibold">{draft.personal.phone || "—"}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground">
                    Nationality
                  </p>
                  <p className="font-semibold">
                    {draft.personal.nationality || "—"}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-muted/40 p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold">Academic selection</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Department and programme choice.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => router.push("/enrollment/step-2")}
                >
                  <MaterialSymbol icon="edit" className="text-[18px]" />
                  Edit
                </Button>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 text-sm">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground">
                    Department
                  </p>
                  <p className="font-semibold">{departmentName}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground">
                    Programme
                  </p>
                  <p className="font-semibold">{programmeName}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground">
                    Session
                  </p>
                  <p className="font-semibold">
                    {draft.academic.sessionId || "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground">
                    Level
                  </p>
                  <p className="font-semibold">{draft.academic.level || "—"}</p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-5">
              <p className="text-sm font-semibold">Declaration</p>
              <p className="mt-1 text-sm text-muted-foreground">
                This platform focuses on announcements and communication.
              </p>

              <label className="mt-4 flex items-start gap-3 text-sm">
                <Checkbox
                  checked={draft.acceptedDeclaration}
                  onCheckedChange={(v) => setAcceptedDeclaration(Boolean(v))}
                />
                <span className="leading-relaxed">
                  I confirm that the details provided are accurate and belong to
                  me.
                </span>
              </label>
            </div>

            {errorLabel ? (
              <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-5">
                <div className="flex items-start gap-3">
                  <MaterialSymbol
                    icon="error"
                    className="mt-0.5 text-[18px] text-destructive"
                  />
                  <div>
                    <p className="text-sm font-semibold text-destructive">
                      {errorLabel.message}
                    </p>
                    {errorLabel.code ? (
                      <p className="mt-1 text-xs text-destructive/80">
                        Code:{" "}
                        <span className="font-semibold">{errorLabel.code}</span>
                      </p>
                    ) : null}
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          <aside className="space-y-4">
            <div className="rounded-2xl border border-border bg-muted/40 p-5">
              <div className="flex items-center gap-2">
                <MaterialSymbol
                  icon="info"
                  className="text-[18px] text-primary"
                />
                <p className="text-[11px] font-semibold uppercase tracking-wider">
                  What happens next?
                </p>
              </div>
              <ul className="mt-3 space-y-2 text-xs text-muted-foreground">
                <li>• Your enrollment request is submitted for review.</li>
                <li>
                  • You’ll receive updates via announcements/notifications.
                </li>
              </ul>
            </div>

            <div
              className={cn(
                "rounded-2xl border border-border bg-card p-5",
                !canSubmit ? "opacity-100" : "",
              )}
            >
              <p className="text-sm font-semibold">Submit</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Submit when you’re ready.
              </p>

              <Button
                type="button"
                className="mt-4 w-full gap-2"
                disabled={!canSubmit}
                onClick={() => setConfirmOpen(true)}
              >
                {submitMutation.isPending ? (
                  <MaterialSymbol
                    icon="hourglass_top"
                    className="text-[18px]"
                  />
                ) : (
                  <MaterialSymbol icon="send" className="text-[18px]" />
                )}
                {submitMutation.isPending
                  ? "Submitting..."
                  : "Submit Application"}
              </Button>
            </div>
          </aside>
        </div>

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/enrollment/step-3")}
            className="gap-2"
          >
            <MaterialSymbol icon="arrow_back" className="text-[18px]" />
            Back
          </Button>

          <Button
            type="button"
            variant="ghost"
            className="gap-2"
            onClick={() => {
              resetDraft();
            }}
          >
            <MaterialSymbol icon="restart_alt" className="text-[18px]" />
            Reset draft
          </Button>
        </div>

        <Dialog
          open={confirmOpen}
          onOpenChange={(v) => !submitMutation.isPending && setConfirmOpen(v)}
        >
          <DialogContent className="w-[calc(100vw-2rem)] max-w-lg">
            <DialogHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-primary/10 text-primary">
                  <MaterialSymbol
                    icon="verified_user"
                    className="text-[20px]"
                  />
                </div>
                <div>
                  <DialogTitle>Confirm Submission</DialogTitle>
                  <DialogDescription>Final verification step</DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-4">
              <div className="rounded-2xl border border-border bg-muted/40 p-4">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Application summary
                </p>
                <div className="mt-3 space-y-2 text-sm">
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-muted-foreground">Programme</span>
                    <span className="text-right font-semibold">
                      {programmeName}
                    </span>
                  </div>
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-muted-foreground">Department</span>
                    <span className="text-right font-semibold">
                      {departmentName}
                    </span>
                  </div>
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-muted-foreground">
                      Application ID
                    </span>
                    <span className="text-right font-semibold">
                      #{draft.draftId}
                    </span>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
                <div className="flex items-start gap-3">
                  <MaterialSymbol
                    icon="warning"
                    className="mt-0.5 text-[18px]"
                  />
                  <p className="text-xs leading-relaxed">
                    Once submitted, your application details cannot be edited.
                    Please confirm all information is accurate.
                  </p>
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => setConfirmOpen(false)}
                disabled={submitMutation.isPending}
              >
                Go Back
              </Button>
              <Button
                type="button"
                className="gap-2"
                onClick={async () => {
                  const ok = await submit();
                  if (ok) setConfirmOpen(false);
                }}
                disabled={!canSubmit}
              >
                <MaterialSymbol icon="task_alt" className="text-[18px]" />
                Confirm & Submit
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </EnrollmentShell>
  );
}
