"use client";

import Link from "next/link";

import * as React from "react";

import { MaterialSymbol } from "@/components/common/MaterialSymbol";
import { ThemeToggle } from "@/components/home/ThemeToggle";
import { Button } from "@/components/ui/button";
import Image from "next/image";

export function EnrollmentNavbar({
  applicationId,
}: {
  applicationId?: string | null;
}) {
  return (
    <header className="fixed top-0 z-50 w-full border-b border-border border-t-4 border-t-brand-gold bg-background/90 shadow-xs backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-border bg-card p-0.5 shadow-xs">
            <Image
              src="/logo-nobg.png"
              alt="USTED Logo"
              width={1000}
              height={1000}
              className="h-full w-full object-contain"
              priority
            />
          </div>
          <div className="leading-tight">
            <p className="font-display text-sm font-semibold tracking-tight text-primary">
              USTED
            </p>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Enrollment Portal
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {applicationId ? (
            <p className="hidden text-xs text-muted-foreground sm:block">
              Application ID:{" "}
              <span className="font-semibold text-foreground">
                #{applicationId}
              </span>
            </p>
          ) : null}

          <ThemeToggle className="h-9 w-9" />

          <Button asChild variant="outline" size="sm" className="gap-2">
            <Link href="/">
              <MaterialSymbol icon="home" className="text-[18px]" />
              Home
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
