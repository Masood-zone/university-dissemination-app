"use client";

import * as React from "react";

import { toast } from "sonner";

import { MaterialSymbol } from "@/components/common/MaterialSymbol";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { getApiErrorLabel } from "@/lib/api-client-error";
import { cn } from "@/lib/utils";
import {
  useGetStudentFinanceSummary,
  usePayStudentFee,
} from "@/services/student/finance/finance";

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

function formatDate(value: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(d);
}

function StatusPill({ status }: { status: string }) {
  const cls = (() => {
    switch (status) {
      case "PAID":
        return "border-emerald-200 bg-emerald-50 text-emerald-700";
      case "PENDING":
        return "border-amber-200 bg-amber-50 text-amber-700";
      case "OVERDUE":
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

export default function StudentFinancePage() {
  const summary = useGetStudentFinanceSummary();
  const pay = usePayStudentFee();

  const currency = summary.data?.totals.currency ?? "GHS";
  const outstanding = summary.data?.totals.outstanding ?? 0;

  const [paymentMethod, setPaymentMethod] = React.useState<
    "M_MONEY" | "CARD_BANK"
  >("M_MONEY");

  const isConfigured = Boolean(summary.data?.configured);
  const feeId = summary.data?.feeId ?? null;

  const canPay =
    isConfigured &&
    Boolean(feeId) &&
    outstanding > 0 &&
    !pay.isPending &&
    !summary.isLoading;

  const handleDownloadInvoice = () => {
    const rows = (summary.data?.breakdown ?? []).map((r) => ({
      description: r.description,
      type: r.kind,
      amount: r.amount,
      status: r.status,
      note: r.note ?? "",
    }));

    if (!rows.length) {
      toast.info("No invoice data to download");
      return;
    }

    const sessionName = summary.data?.sessionName ?? "session";
    downloadCsv(`invoice-${sessionName}.csv`, rows);
  };

  const handlePay = async () => {
    if (!feeId) return;

    try {
      await pay.mutateAsync({ feeId, paymentMethod });
      toast.success("Payment recorded");
    } catch (error) {
      const label = getApiErrorLabel(error);
      toast.error(label.message);
    }
  };

  return (
    <section className="space-y-8">
      <header>
        <h1 className="font-display text-xl font-semibold">Finance & Fees</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Fee breakdown, payment history, and outstanding balance.
        </p>
      </header>

      {summary.isError ? (
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-sm font-semibold">Failed to load finance</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {getApiErrorLabel(summary.error).message}
          </p>
        </div>
      ) : null}

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {summary.isLoading ? (
          Array.from({ length: 4 }).map((_, idx) => (
            <div
              key={idx}
              className="rounded-2xl border border-border bg-card p-6"
            >
              <Skeleton className="h-4 w-24" />
              <Skeleton className="mt-3 h-8 w-36" />
              <Skeleton className="mt-3 h-4 w-32" />
            </div>
          ))
        ) : (
          <>
            <div className="rounded-2xl border border-border bg-card p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Total Fees
                  </p>
                  <p className="mt-2 font-display text-2xl font-semibold">
                    {formatMoney(summary.data?.totals.totalFee ?? 0, currency)}
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {summary.data?.sessionName ?? "Active session"}
                  </p>
                </div>
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-lg bg-muted text-foreground">
                  <MaterialSymbol icon="payments" className="text-[22px]" />
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Balance Due
                  </p>
                  <p className="mt-2 font-display text-2xl font-semibold">
                    {formatMoney(outstanding, currency)}
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {summary.data?.feeStatus ?? "—"}
                  </p>
                </div>
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-lg bg-muted text-foreground">
                  <MaterialSymbol
                    icon="account_balance_wallet"
                    className="text-[22px]"
                  />
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Total Paid
                  </p>
                  <p className="mt-2 font-display text-2xl font-semibold">
                    {formatMoney(summary.data?.totals.totalPaid ?? 0, currency)}
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Successful payments
                  </p>
                </div>
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-lg bg-muted text-foreground">
                  <MaterialSymbol icon="check_circle" className="text-[22px]" />
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Payment Deadline
                  </p>
                  <p className="mt-2 font-display text-2xl font-semibold">
                    {formatDate(summary.data?.totals.dueAt ?? null)}
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {summary.data?.semester
                      ? summary.data.semester === "FIRST"
                        ? "Semester 1"
                        : "Semester 2"
                      : "—"}
                  </p>
                </div>
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-lg bg-muted text-foreground">
                  <MaterialSymbol icon="event" className="text-[22px]" />
                </div>
              </div>
            </div>
          </>
        )}
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2 space-y-6">
          <section className="rounded-2xl border border-border bg-card overflow-hidden">
            <div className="p-5 border-b border-border flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <MaterialSymbol
                  icon="receipt_long"
                  className="text-[18px] text-muted-foreground"
                />
                <h2 className="font-display text-base font-semibold">
                  Fee Breakdown (Current Semester)
                </h2>
              </div>

              <Button
                type="button"
                variant="ghost"
                onClick={handleDownloadInvoice}
                className="gap-2"
                disabled={
                  summary.isLoading || !(summary.data?.breakdown ?? []).length
                }
              >
                <MaterialSymbol icon="download" className="text-[18px]" />
                Download invoice
              </Button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/30 text-muted-foreground">
                  <tr>
                    <th className="px-5 py-3 text-left font-semibold">
                      Description
                    </th>
                    <th className="px-5 py-3 text-left font-semibold">Type</th>
                    <th className="px-5 py-3 text-right font-semibold">
                      Amount ({currency})
                    </th>
                    <th className="px-5 py-3 text-center font-semibold">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {summary.isLoading ? (
                    Array.from({ length: 3 }).map((_, idx) => (
                      <tr key={idx}>
                        <td className="px-5 py-4" colSpan={4}>
                          <Skeleton className="h-4 w-1/2" />
                        </td>
                      </tr>
                    ))
                  ) : (summary.data?.breakdown ?? []).length === 0 ? (
                    <tr>
                      <td
                        className="px-5 py-6 text-center text-muted-foreground"
                        colSpan={4}
                      >
                        {isConfigured
                          ? "No fee items configured for this session."
                          : "Fees have not been configured yet."}
                      </td>
                    </tr>
                  ) : (
                    (summary.data?.breakdown ?? []).map((row) => (
                      <tr key={row.key}>
                        <td className="px-5 py-4">
                          <p className="font-semibold">{row.description}</p>
                          <p className="text-xs text-muted-foreground italic">
                            {row.note}
                          </p>
                        </td>
                        <td className="px-5 py-4">{row.kind}</td>
                        <td className="px-5 py-4 text-right font-semibold">
                          {formatMoney(row.amount, currency)}
                        </td>
                        <td className="px-5 py-4 text-center">
                          <StatusPill status={row.status} />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                <tfoot className="bg-muted/30">
                  <tr className="font-semibold">
                    <td className="px-5 py-4 text-right" colSpan={2}>
                      Grand Total
                    </td>
                    <td className="px-5 py-4 text-right">
                      {formatMoney(
                        summary.data?.totals.totalFee ?? 0,
                        currency,
                      )}
                    </td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-card overflow-hidden">
            <div className="p-5 border-b border-border flex items-center gap-2">
              <MaterialSymbol
                icon="history"
                className="text-[18px] text-muted-foreground"
              />
              <h2 className="font-display text-base font-semibold">
                Transaction History
              </h2>
            </div>

            <div className="divide-y divide-border">
              {summary.isLoading ? (
                Array.from({ length: 3 }).map((_, idx) => (
                  <div key={idx} className="p-5">
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="mt-2 h-3 w-1/3" />
                  </div>
                ))
              ) : (summary.data?.transactions ?? []).length === 0 ? (
                <div className="p-5 text-sm text-muted-foreground">
                  No transactions yet.
                </div>
              ) : (
                (summary.data?.transactions ?? []).map((t) => (
                  <div
                    key={t.id}
                    className="p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate">
                        {t.paymentMethod === "M_MONEY"
                          ? "Mobile Money Payment"
                          : "Card/Bank Payment"}
                      </p>
                      <p className="text-xs text-muted-foreground italic truncate">
                        Ref: {t.reference}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 justify-between sm:justify-end">
                      <p className="text-sm font-semibold">
                        {formatMoney(t.amount, t.currency)}
                      </p>
                      <StatusPill status={t.status} />
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>

        <aside className="space-y-6">
          <section className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-display text-base font-semibold">
                  Secure Pay Now
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Record a simulated payment and clear your balance.
                </p>
              </div>
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-foreground">
                <MaterialSymbol
                  icon="lock"
                  className="text-[20px] text-muted-foreground"
                />
              </div>
            </div>

            <div className="mt-5 space-y-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Amount to Pay ({currency})
                </p>
                <div className="mt-2">
                  <Input
                    value={String(outstanding.toFixed(2))}
                    readOnly
                    aria-label="Amount to pay"
                  />
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Payment Method
                </p>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant={
                      paymentMethod === "M_MONEY" ? "default" : "outline"
                    }
                    onClick={() => setPaymentMethod("M_MONEY")}
                  >
                    M-Money
                  </Button>
                  <Button
                    type="button"
                    variant={
                      paymentMethod === "CARD_BANK" ? "default" : "outline"
                    }
                    onClick={() => setPaymentMethod("CARD_BANK")}
                  >
                    Card/Bank
                  </Button>
                </div>
              </div>

              <Button
                type="button"
                onClick={handlePay}
                disabled={!canPay}
                className="w-full gap-2"
              >
                <MaterialSymbol icon="arrow_forward" className="text-[18px]" />
                {pay.isPending ? "Processing…" : "Process Payment"}
              </Button>

              {!isConfigured ? (
                <p className="text-xs text-muted-foreground">
                  Fees are not configured yet for the active session.
                </p>
              ) : outstanding <= 0 ? (
                <p className="text-xs text-muted-foreground">
                  No outstanding balance to pay.
                </p>
              ) : null}
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center gap-2">
              <MaterialSymbol
                icon="help"
                className="text-[18px] text-muted-foreground"
              />
              <p className="font-display text-base font-semibold">Need Help?</p>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              If you notice any discrepancy in your fees or payments, please
              contact the Finance Directorate.
            </p>

            <div className="mt-4 space-y-2 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <MaterialSymbol icon="mail" className="text-[18px]" />
                <span>finance@USTED.edu.gh</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <MaterialSymbol icon="call" className="text-[18px]" />
                <span>+233 03 220 12345</span>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center gap-2">
              <MaterialSymbol
                icon="policy"
                className="text-[18px] text-muted-foreground"
              />
              <p className="text-sm font-semibold">Fee Policy Note</p>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Ensure at least 60% of fees are paid before the 8th week of the
              semester to be eligible for mid-semester examinations.
            </p>
          </section>
        </aside>
      </section>
    </section>
  );
}
