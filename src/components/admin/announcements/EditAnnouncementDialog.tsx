"use client";

import { useMemo } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getApiErrorLabel } from "@/lib/api-client-error";
import {
  useAdminAnnouncementDetail,
  useUpdateAnnouncement,
} from "@/services/admin/announcements/announcements";
import type { UpsertAnnouncementInput } from "@/types";

import {
  adminDetailToFormInitial,
  AnnouncementUpsertForm,
} from "./AnnouncementUpsertForm";

export default function EditAnnouncementDialog({
  announcementId,
  open,
  onOpenChange,
}: {
  announcementId: string | null;
  open: boolean;
  onOpenChange: (next: boolean) => void;
}) {
  const detailQuery = useAdminAnnouncementDetail(open ? announcementId : null);
  const updateMutation = useUpdateAnnouncement();

  const initial = useMemo(() => {
    if (!detailQuery.data) return undefined;
    return adminDetailToFormInitial(detailQuery.data);
  }, [detailQuery.data]);

  const errorLabel = detailQuery.error
    ? getApiErrorLabel(detailQuery.error)
    : updateMutation.error
      ? getApiErrorLabel(updateMutation.error)
      : null;

  const errorText = errorLabel
    ? errorLabel.code
      ? `${errorLabel.message} (${errorLabel.code})`
      : errorLabel.message
    : null;

  const submit = async (payload: UpsertAnnouncementInput) => {
    if (!announcementId) throw new Error("Missing announcement id");
    await updateMutation.mutateAsync({ id: announcementId, input: payload });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-6xl max-h-[calc(100vh-2rem)] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Edit announcement</DialogTitle>
          <DialogDescription>
            Update content, schedule, priority, and visibility.
          </DialogDescription>
        </DialogHeader>

        {errorText ? (
          <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            {errorText}
          </div>
        ) : null}

        <div className="min-h-0 flex-1 overflow-y-auto pr-1">
          {detailQuery.isLoading || !initial ? (
            <div className="text-sm text-muted-foreground">Loading...</div>
          ) : (
            <AnnouncementUpsertForm
              key={announcementId ?? undefined}
              initial={initial}
              submitLabel="Save changes"
              busy={updateMutation.isPending}
              onSubmit={submit}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
