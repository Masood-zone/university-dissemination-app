"use client";

import { MaterialSymbol } from "@/components/common/MaterialSymbol";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn, getInitials } from "@/lib/utils";

function formatLastLogin(iso: string | null): string {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString();
}

function VerifiedPill({ verified }: { verified: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider",
        verified
          ? "border-emerald-200/60 bg-emerald-50 text-emerald-700"
          : "border-amber-200/60 bg-amber-50 text-amber-700",
      )}
    >
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          verified ? "bg-emerald-500" : "bg-amber-500",
        )}
      />
      {verified ? "Verified" : "Unverified"}
    </span>
  );
}

export type ProfileCardData = {
  name: string;
  subtitle: string;
  email: string;
  phone: string | null;
  departmentName: string | null;
  avatarUrl: string | null;
  emailVerified: boolean;
  lastLogin: string | null;
  primaryMeta: Array<{ label: string; value: string | null }>;
  secondaryMeta?: Array<{ label: string; value: string | null }>;
};

export function ProfilePageShell({
  title,
  loading,
  error,
  data,
}: {
  title: string;
  loading: boolean;
  error: string | null;
  data: ProfileCardData | null;
}) {
  return (
    <section className="space-y-6">
      <header className="flex items-center gap-3">
        <MaterialSymbol
          icon="person"
          className="text-[22px] text-muted-foreground"
        />
        <div>
          <h1 className="font-lexend text-2xl font-semibold tracking-tight">
            {title}
          </h1>
          <p className="text-sm text-muted-foreground">
            View and manage your profile information.
          </p>
        </div>
      </header>

      {error ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4">
          <p className="text-sm font-semibold">Failed to load profile</p>
          <p className="mt-1 text-sm text-muted-foreground">{error}</p>
        </div>
      ) : null}

      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="h-24 bg-primary" />
        <div className="-mt-10 flex flex-col gap-4 px-6 pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-end gap-4">
            <div className="h-20 w-20 overflow-hidden rounded-2xl border-4 border-background bg-muted flex items-center justify-center">
              {loading || !data ? (
                <Skeleton className="h-full w-full" />
              ) : data.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={data.avatarUrl}
                  alt="Avatar"
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-lg font-bold text-muted-foreground">
                  {getInitials(data.name)}
                </span>
              )}
            </div>

            <div className="pb-1">
              {loading || !data ? (
                <>
                  <Skeleton className="h-6 w-56" />
                  <Skeleton className="mt-2 h-4 w-72" />
                </>
              ) : (
                <>
                  <h2 className="font-lexend text-xl font-semibold tracking-tight">
                    {data.name}
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {data.subtitle}
                  </p>
                </>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button type="button" disabled>
              <MaterialSymbol icon="edit" className="text-[18px]" />
              Edit Profile
            </Button>
            <Button type="button" variant="outline" disabled>
              <MaterialSymbol icon="lock" className="text-[18px]" />
              Change Password
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="flex items-center gap-2">
              <MaterialSymbol
                icon="badge"
                className="text-[18px] text-primary"
              />
              <h3 className="text-sm font-semibold">Personal Information</h3>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  Full name
                </p>
                <p className="mt-1 text-sm">
                  {loading || !data ? "—" : data.name}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  Email address
                </p>
                <p className="mt-1 text-sm">
                  {loading || !data ? "—" : data.email}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  Phone number
                </p>
                <p className="mt-1 text-sm">
                  {loading || !data ? "—" : data.phone || "—"}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  Department
                </p>
                <p className="mt-1 text-sm">
                  {loading || !data ? "—" : data.departmentName || "—"}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <MaterialSymbol
                  icon="school"
                  className="text-[18px] text-primary"
                />
                <h3 className="text-sm font-semibold">
                  Academic &amp; Professional Details
                </h3>
              </div>
              {loading || !data ? null : (
                <span className="rounded-full border border-border bg-muted/40 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  {data.subtitle}
                </span>
              )}
            </div>

            <div className="mt-5 grid grid-cols-1 gap-6 sm:grid-cols-2">
              {(loading || !data ? [] : data.primaryMeta).map((item) => (
                <div key={item.label}>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    {item.label}
                  </p>
                  <p className="mt-1 text-sm">{item.value || "—"}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-border bg-card p-6">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Account health
            </p>

            <div className="mt-4 space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Status</span>
                {loading || !data ? (
                  <Skeleton className="h-5 w-20" />
                ) : (
                  <VerifiedPill verified={data.emailVerified} />
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Last login</span>
                <span className="text-xs">
                  {loading || !data ? "—" : formatLastLogin(data.lastLogin)}
                </span>
              </div>
            </div>

            <div className="mt-5">
              <Button
                type="button"
                variant="ghost"
                className="w-full text-destructive"
                disabled
              >
                Deactivate Account
              </Button>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Recent login history
            </p>
            <p className="mt-3 text-xs text-muted-foreground">Coming soon.</p>
            <div className="mt-4">
              <Button
                type="button"
                variant="outline"
                className="w-full"
                disabled
              >
                View full logs
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
