"use client";

import * as React from "react";

import { toast } from "sonner";

import { MaterialSymbol } from "@/components/common/MaterialSymbol";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { getApiErrorLabel } from "@/lib/api-client-error";
import { cn } from "@/lib/utils";
import {
  useGetFinanceAnalytics,
  useGetFinanceProgrammes,
  useGetFinanceTransactions,
  useGetProgrammeFeeAllocation,
  useUpsertProgrammeFeeAllocation,
} from "@/services/admin/finance/finance";
import type {
  PaymentTransactionStatusFilter,
  ProgrammeFeeAllocation,
} from "@/types";

function useDebouncedValue<T>(value: T, delayMs: number) {
  const [debounced, setDebounced] = React.useState(value);

  React.useEffect(() => {
    const handle = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(handle);
  }, [delayMs, value]);

  return debounced;
}

function formatMoney(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat("en-GH", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

function formatPercent(value: number) {
  return `${Math.round(value * 10) / 10}%`;
}

function StatusPill({ status }: { status: string }) {
  const cls = (() => {
    switch (status) {
      case "SUCCESS":
        return "border-emerald-200 bg-emerald-50 text-emerald-700";
      case "PENDING":
        return "border-amber-200 bg-amber-50 text-amber-700";
      case "FAILED":
        return "border-red-200 bg-red-50 text-red-700";
      case "CANCELLED":
        return "border-slate-200 bg-slate-50 text-slate-700";
      default:
        return "border-border bg-muted text-muted-foreground";
    }
  })();

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold",
        cls,
      )}
    >
      {status}
    </span>
  );
}

function AnalyticsSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="mt-3 h-8 w-36" />
          <Skeleton className="mt-3 h-3 w-40" />
        </div>
        <Skeleton className="h-11 w-11 rounded-lg" />
      </div>
    </div>
  );
}

function downloadCsv(filename: string, rows: Array<Record<string, unknown>>) {
  const headers = Array.from(new Set(rows.flatMap((row) => Object.keys(row))));

  const escapeCell = (value: unknown) => {
    const str = value == null ? "" : String(value);
    return `"${str.replaceAll('"', '""')}"`;
  };

  const lines = [
    headers.join(","),
    ...rows.map((row) => headers.map((h) => escapeCell(row[h])).join(",")),
  ];

  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export default function FinancePage() {
  const [range, setRange] = React.useState<"7d" | "30d" | "90d">("30d");
  const [status, setStatus] =
    React.useState<PaymentTransactionStatusFilter>("ALL");
  const [query, setQuery] = React.useState("");
  const debouncedQuery = useDebouncedValue(query, 250);

  const analytics = useGetFinanceAnalytics();
  const transactions = useGetFinanceTransactions({
    q: debouncedQuery,
    range,
    status,
  });
  const programmes = useGetFinanceProgrammes();

  const [programmeId, setProgrammeId] = React.useState<string | null>(null);
  const [semester, setSemester] = React.useState<"FIRST" | "SECOND">("FIRST");

  React.useEffect(() => {
    if (programmeId) return;
    const first = programmes.data?.[0]?.id;
    if (first) setProgrammeId(first);
  }, [programmeId, programmes.data]);

  const allocation = useGetProgrammeFeeAllocation(programmeId, semester);
  const upsertAllocation = useUpsertProgrammeFeeAllocation();

  const [feeState, setFeeState] = React.useState({
    tuitionFee: "",
    libraryFee: "",
    facilityFee: "",
  });

  const setFromAllocation = React.useCallback(
    (data: ProgrammeFeeAllocation) => {
      setFeeState({
        tuitionFee: String(data.tuitionFee ?? 0),
        libraryFee: String(data.libraryFee ?? 0),
        facilityFee: String(data.facilityFee ?? 0),
      });
    },
    [],
  );

  React.useEffect(() => {
    if (!allocation.data) return;
    setFromAllocation(allocation.data);
  }, [allocation.data, setFromAllocation]);

  const numericFees = React.useMemo(() => {
    const toNumber = (raw: string) => {
      const trimmed = raw.trim();
      if (!trimmed) return 0;
      const n = Number(trimmed.replaceAll(",", ""));
      return Number.isFinite(n) ? n : 0;
    };

    const tuitionFee = toNumber(feeState.tuitionFee);
    const libraryFee = toNumber(feeState.libraryFee);
    const facilityFee = toNumber(feeState.facilityFee);
    return {
      tuitionFee,
      libraryFee,
      facilityFee,
      totalFee: tuitionFee + libraryFee + facilityFee,
    };
  }, [feeState.facilityFee, feeState.libraryFee, feeState.tuitionFee]);

  const analyticsCurrency =
    transactions.data?.rows?.[0]?.currency ??
    allocation.data?.currency ??
    "GHS";

  const exportTransactions = () => {
    const rows = transactions.data?.rows ?? [];
    if (!rows.length) {
      toast.info("No transactions to export");
      return;
    }

    downloadCsv(
      `transactions-${range}.csv`,
      rows.map((r) => ({
        reference: r.reference,
        student: r.studentName,
        amount: r.amount,
        currency: r.currency,
        status: r.status,
        createdAt: r.createdAt,
      })),
    );
  };

  const saveAllocation = async () => {
    if (!programmeId) {
      toast.error("Select a programme first");
      return;
    }

    try {
      await upsertAllocation.mutateAsync({
        programmeId,
        semester,
        tuitionFee: numericFees.tuitionFee,
        libraryFee: numericFees.libraryFee,
        facilityFee: numericFees.facilityFee,
      });
      toast.success("Programme fee updated");
    } catch (error) {
      const label = getApiErrorLabel(error);
      toast.error(label.message);
    }
  };

  const txnDateFormatter = React.useMemo(
    () =>
      new Intl.DateTimeFormat("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
    [],
  );

  return (
    <section className="space-y-8">
      <header>
        <h1 className="font-display text-xl font-semibold">Finance & Revenue</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Revenue analytics, payment transactions, and programme fee allocation.
        </p>
      </header>

      <section className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-display text-lg font-semibold">Analytics</h2>
            <p className="text-sm text-muted-foreground">
              Overview of collections and outstanding balances.
            </p>
          </div>

          <div className="text-right">
            <p className="text-xs text-muted-foreground">Active Session</p>
            <p className="text-sm font-semibold">
              {analytics.data?.sessionName ?? "Not set"}
            </p>
          </div>
        </div>

        {analytics.isError ? (
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-sm font-semibold">Failed to load analytics</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {getApiErrorLabel(analytics.error).message}
            </p>
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {analytics.isLoading ? (
            Array.from({ length: 4 }).map((_, idx) => (
              <AnalyticsSkeleton key={idx} />
            ))
          ) : (
            <>
              <div className="rounded-xl border border-border bg-card p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Total Revenue
                    </p>
                    <p className="mt-2 font-display text-2xl font-semibold">
                      {formatMoney(
                        analytics.data?.totalRevenue ?? 0,
                        analyticsCurrency,
                      )}
                    </p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      Successful collections
                    </p>
                  </div>
                  <div className="inline-flex h-11 w-11 items-center justify-center rounded-lg bg-muted text-foreground">
                    <MaterialSymbol icon="payments" className="text-[22px]" />
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-border bg-card p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Outstanding Fees
                    </p>
                    <p className="mt-2 font-display text-2xl font-semibold">
                      {formatMoney(
                        analytics.data?.outstandingFees ?? 0,
                        analyticsCurrency,
                      )}
                    </p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      Pending/overdue obligations
                    </p>
                  </div>
                  <div className="inline-flex h-11 w-11 items-center justify-center rounded-lg bg-muted text-foreground">
                    <MaterialSymbol
                      icon="receipt_long"
                      className="text-[22px]"
                    />
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-border bg-card p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Collection Rate
                    </p>
                    <p className="mt-2 font-display text-2xl font-semibold">
                      {analytics.data?.collectionRate == null
                        ? "—"
                        : formatPercent(analytics.data.collectionRate)}
                    </p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      Target: {analytics.data?.targetCollectionRate ?? 90}%
                    </p>
                  </div>
                  <div className="inline-flex h-11 w-11 items-center justify-center rounded-lg bg-muted text-foreground">
                    <MaterialSymbol icon="percent" className="text-[22px]" />
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-border bg-card p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Fees Assessed
                    </p>
                    <p className="mt-2 font-display text-2xl font-semibold">
                      {formatMoney(
                        analytics.data?.feesAssessed ?? 0,
                        analyticsCurrency,
                      )}
                    </p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      Billed: {analytics.data?.billedStudents ?? 0} students
                    </p>
                  </div>
                  <div className="inline-flex h-11 w-11 items-center justify-center rounded-lg bg-muted text-foreground">
                    <MaterialSymbol
                      icon="account_balance"
                      className="text-[22px]"
                    />
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </section>

      <section className="rounded-xl border border-border bg-card">
        <div className="flex flex-col gap-4 border-b border-border p-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="font-display text-lg font-semibold">
              Payment Transactions
            </h2>
            <p className="text-sm text-muted-foreground">
              Recent payment records with status and references.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex items-center gap-2">
              <Select
                value={range}
                onValueChange={(value) =>
                  setRange(value as "7d" | "30d" | "90d")
                }
              >
                <SelectTrigger
                  className="w-full sm:w-36"
                  aria-label="Select date range"
                >
                  <SelectValue placeholder="Last 30 days" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">Last 7 days</SelectItem>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                  <SelectItem value="90d">Last 90 days</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={status}
                onValueChange={(value) =>
                  setStatus(value as PaymentTransactionStatusFilter)
                }
              >
                <SelectTrigger
                  className="w-full sm:w-44"
                  aria-label="Select status"
                >
                  <SelectValue placeholder="All status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All status</SelectItem>
                  <SelectItem value="SUCCESS">Success</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="FAILED">Failed</SelectItem>
                  <SelectItem value="REVERSED">Reversed</SelectItem>
                  <SelectItem value="REFUNDED">Refunded</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="relative w-full sm:w-64">
              <MaterialSymbol
                icon="search"
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-muted-foreground"
              />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search reference..."
                className="pl-9"
              />
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={exportTransactions}
              className="gap-2"
            >
              <MaterialSymbol icon="download" className="text-[18px]" />
              Export
            </Button>
          </div>
        </div>

        {transactions.isError ? (
          <div className="p-5">
            <div className="rounded-xl border border-border bg-background p-4">
              <p className="text-sm font-semibold">
                Failed to load transactions
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {getApiErrorLabel(transactions.error).message}
              </p>
            </div>
          </div>
        ) : null}

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                <th className="px-5 py-3">Reference</th>
                <th className="px-5 py-3">Student</th>
                <th className="px-5 py-3">Amount</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {transactions.isLoading ? (
                Array.from({ length: 6 }).map((_, idx) => (
                  <tr key={idx}>
                    <td className="px-5 py-4" colSpan={5}>
                      <Skeleton className="h-5 w-full" />
                    </td>
                  </tr>
                ))
              ) : (transactions.data?.rows ?? []).length === 0 ? (
                <tr>
                  <td
                    className="px-5 py-8 text-center text-sm text-muted-foreground"
                    colSpan={5}
                  >
                    No transactions found.
                  </td>
                </tr>
              ) : (
                (transactions.data?.rows ?? []).map((row) => {
                  const created = new Date(row.createdAt);
                  const createdLabel = Number.isNaN(created.getTime())
                    ? row.createdAt
                    : txnDateFormatter.format(created);

                  return (
                    <tr key={row.id} className="hover:bg-accent/40">
                      <td className="px-5 py-4">
                        <p className="font-semibold leading-tight">
                          {row.reference}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {row.studentId}
                        </p>
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-semibold leading-tight">
                          {row.studentName}
                        </p>
                      </td>
                      <td className="px-5 py-4 font-semibold">
                        {formatMoney(row.amount, row.currency)}
                      </td>
                      <td className="px-5 py-4">
                        <StatusPill status={row.status} />
                      </td>
                      <td className="px-5 py-4 text-muted-foreground">
                        {createdLabel}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <section className="lg:col-span-2 rounded-xl border border-border bg-card">
          <div className="border-b border-border p-5">
            <h2 className="font-display text-lg font-semibold">
              Programme Fee Allocation
            </h2>
            <p className="text-sm text-muted-foreground">
              Configure fees per programme for the active session and semester.
            </p>
          </div>

          <div className="p-5 space-y-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Programme
                </p>
                <Select
                  value={programmeId ?? "__none"}
                  onValueChange={(value) =>
                    setProgrammeId(value === "__none" ? null : value)
                  }
                  disabled={
                    programmes.isLoading || (programmes.data ?? []).length === 0
                  }
                >
                  <SelectTrigger
                    className="mt-2 w-full"
                    aria-label="Select programme"
                  >
                    <SelectValue
                      placeholder={
                        programmes.isLoading
                          ? "Loading..."
                          : (programmes.data ?? []).length === 0
                            ? "No programmes"
                            : "Select programme"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {programmes.isLoading ? (
                      <SelectItem value="__loading" disabled>
                        Loading...
                      </SelectItem>
                    ) : (programmes.data ?? []).length === 0 ? (
                      <SelectItem value="__empty" disabled>
                        No programmes
                      </SelectItem>
                    ) : (
                      <>
                        <SelectItem value="__none">Select programme</SelectItem>
                        {(programmes.data ?? []).map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.code} — {p.name}
                          </SelectItem>
                        ))}
                      </>
                    )}
                  </SelectContent>
                </Select>
                {programmes.isError ? (
                  <p className="mt-2 text-xs text-destructive">
                    {getApiErrorLabel(programmes.error).message}
                  </p>
                ) : null}
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Semester
                </p>
                <div className="mt-2 flex gap-2">
                  <Button
                    type="button"
                    variant={semester === "FIRST" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSemester("FIRST")}
                  >
                    First
                  </Button>
                  <Button
                    type="button"
                    variant={semester === "SECOND" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSemester("SECOND")}
                  >
                    Second
                  </Button>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  {allocation.data?.sessionName
                    ? `Active session: ${allocation.data.sessionName}`
                    : "Fees are saved against the active session."}
                </p>
              </div>
            </div>

            {allocation.isError ? (
              <div className="rounded-xl border border-border bg-background p-4">
                <p className="text-sm font-semibold">
                  Unable to load fee setup
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {getApiErrorLabel(allocation.error).message}
                </p>
              </div>
            ) : null}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Tuition Fee
                </p>
                <Input
                  inputMode="decimal"
                  value={feeState.tuitionFee}
                  onChange={(e) =>
                    setFeeState((s) => ({ ...s, tuitionFee: e.target.value }))
                  }
                  placeholder="0"
                  className="mt-2"
                  disabled={!programmeId || allocation.isLoading}
                />
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Library Fee
                </p>
                <Input
                  inputMode="decimal"
                  value={feeState.libraryFee}
                  onChange={(e) =>
                    setFeeState((s) => ({ ...s, libraryFee: e.target.value }))
                  }
                  placeholder="0"
                  className="mt-2"
                  disabled={!programmeId || allocation.isLoading}
                />
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Facility Fee
                </p>
                <Input
                  inputMode="decimal"
                  value={feeState.facilityFee}
                  onChange={(e) =>
                    setFeeState((s) => ({ ...s, facilityFee: e.target.value }))
                  }
                  placeholder="0"
                  className="mt-2"
                  disabled={!programmeId || allocation.isLoading}
                />
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-border bg-background p-4">
              <div>
                <p className="text-sm font-semibold">Computed Total</p>
                <p className="text-xs text-muted-foreground">
                  {allocation.data?.configured
                    ? "This programme has a saved fee configuration."
                    : "No saved configuration yet for this programme/semester."}
                </p>
              </div>
              <div className="text-right">
                <p className="font-display text-xl font-semibold">
                  {formatMoney(
                    numericFees.totalFee,
                    allocation.data?.currency ?? "GHS",
                  )}
                </p>
                <p className="text-xs text-muted-foreground">
                  Currency: {allocation.data?.currency ?? "GHS"}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  if (allocation.data) setFromAllocation(allocation.data);
                }}
                disabled={!allocation.data}
              >
                Reset
              </Button>
              <Button
                type="button"
                onClick={saveAllocation}
                disabled={!programmeId || upsertAllocation.isPending}
                className="gap-2"
              >
                <MaterialSymbol icon="save" className="text-[18px]" />
                {upsertAllocation.isPending ? "Saving..." : "Save Allocation"}
              </Button>
            </div>
          </div>
        </section>

        <aside className="space-y-6">
          <div className="rounded-xl border border-border bg-primary text-primary-foreground p-5 relative overflow-hidden">
            <div className="relative z-10">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-primary-foreground/80">
                Fee Setup Note
              </p>
              <p className="mt-3 font-display text-lg font-semibold">
                Active session required
              </p>
              <p className="mt-2 text-sm text-primary-foreground/80">
                Programme fees are stored per active academic session and
                semester. Ensure one session is marked active in Academic
                Sessions.
              </p>
            </div>
            <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-primary-foreground/10" />
          </div>

          <div className="rounded-xl border border-border bg-card p-5">
            <p className="text-sm font-semibold">Tips</p>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li className="flex gap-2">
                <MaterialSymbol icon="info" className="text-[18px]" />
                Use the same currency across programmes.
              </li>
              <li className="flex gap-2">
                <MaterialSymbol icon="info" className="text-[18px]" />
                Save fees for each semester separately.
              </li>
            </ul>
          </div>
        </aside>
      </section>
    </section>
  );
}
