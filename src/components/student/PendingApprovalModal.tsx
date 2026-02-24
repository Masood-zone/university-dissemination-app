"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { MaterialSymbol } from "@/components/common/MaterialSymbol";
import { Button } from "@/components/ui/button";
import { userLogout } from "@/services/auth/user-auth";

export function PendingApprovalModal({
  open,
  studentName,
}: {
  open: boolean;
  studentName: string;
}) {
  const router = useRouter();

  const onSignOut = async () => {
    await userLogout();
    router.refresh();
    router.push("/");
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-background/60 backdrop-blur-md" />

      <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-border bg-card shadow-lg">
        <div className="h-1 w-full bg-linear-to-r from-primary via-primary/60 to-primary" />

        <div className="p-8 text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full border border-border bg-primary/10 text-primary">
            <MaterialSymbol icon="pending_actions" className="text-[44px]" />
          </div>

          <h2 className="text-2xl font-semibold tracking-tight">
            Account Pending Approval
          </h2>

          <div className="mt-4 space-y-4 text-sm text-muted-foreground">
            <p className="text-base leading-relaxed">
              Welcome to the AAMUSTED Student Portal,{" "}
              <span className="font-semibold text-foreground">
                {studentName || "Student"}
              </span>
              .
            </p>
            <p>
              Your application is currently being reviewed by the Admissions and
              Records team. Access to the full dashboard and other modules will
              be granted once your status is verified.
            </p>

            <div className="mx-auto flex max-w-md items-center justify-center gap-3 rounded-2xl border border-border bg-muted/40 p-4">
              <MaterialSymbol
                icon="info"
                className="text-[18px] text-primary"
              />
              <span className="text-xs font-medium">
                Estimated verification time: 24 - 48 hours.
              </span>
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button
              type="button"
              className="gap-2"
              onClick={() => router.push("/#contact")}
            >
              <MaterialSymbol icon="contact_support" className="text-[18px]" />
              Contact Support
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => void onSignOut()}
            >
              Sign Out
            </Button>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-border bg-muted/30 px-8 py-4">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            AAMUSTED ERP
          </span>
          <div className="flex gap-2">
            <div className="h-2 w-2 rounded-full bg-primary" />
            <div className="h-2 w-2 rounded-full bg-muted-foreground/30" />
            <div className="h-2 w-2 rounded-full bg-muted-foreground/30" />
          </div>
        </div>
      </div>
    </div>
  );
}
