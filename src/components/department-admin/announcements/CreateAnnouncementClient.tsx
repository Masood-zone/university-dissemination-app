"use client";

import { useRouter } from "next/navigation";

import { MaterialSymbol } from "@/components/common/MaterialSymbol";
import { Button } from "@/components/ui/button";
import { getApiErrorLabel } from "@/lib/api-client-error";
import { useDepartmentAdminCreateAnnouncement } from "@/services/department-admin/announcement/announcement";
import type { UpsertAnnouncementInput } from "@/types";

import { AnnouncementUpsertForm } from "./AnnouncementUpsertForm";

export default function CreateAnnouncementClient() {
  const router = useRouter();
  const createMutation = useDepartmentAdminCreateAnnouncement();

  const errorLabel = createMutation.error
    ? getApiErrorLabel(createMutation.error).message
    : null;

  const submit = async (payload: UpsertAnnouncementInput) => {
    const res = await createMutation.mutateAsync(payload);
    router.push(`/department-admin/announcements/${res.id}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold">Create announcement</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Compose, schedule, and publish announcements for your department.
          </p>
        </div>

        <Button type="button" variant="outline" onClick={() => router.back()}>
          <MaterialSymbol icon="arrow_back" className="text-[18px]" />
          Back
        </Button>
      </div>

      {errorLabel ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4">
          <p className="text-sm font-semibold">Failed to create announcement</p>
          <p className="mt-1 text-sm text-muted-foreground">{errorLabel}</p>
        </div>
      ) : null}

      <AnnouncementUpsertForm
        submitLabel="Create announcement"
        busy={createMutation.isPending}
        onSubmit={submit}
      />
    </div>
  );
}
