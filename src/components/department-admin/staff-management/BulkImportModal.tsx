"use client";

import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MaterialSymbol } from "@/components/common/MaterialSymbol";
import { cn } from "@/lib/utils";
import { useDepartmentAdminBulkImportStaff } from "@/services/department-admin/staff-management/staff-management";
import type { DepartmentAdminCreateStaffUserInput } from "@/types";

type ParsedResult = {
  rows: DepartmentAdminCreateStaffUserInput[];
  errors: Array<{ row: number; message: string }>;
};

function normalizeHeader(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "");
}

function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];

    if (ch === '"') {
      const next = line[i + 1];
      if (inQuotes && next === '"') {
        current += '"';
        i++;
        continue;
      }
      inQuotes = !inQuotes;
      continue;
    }

    if (ch === "," && !inQuotes) {
      out.push(current);
      current = "";
      continue;
    }

    current += ch;
  }

  out.push(current);
  return out.map((v) => v.trim());
}

function parseCsv(text: string): ParsedResult {
  const rawLines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  if (rawLines.length < 2) {
    return {
      rows: [],
      errors: [
        { row: 0, message: "CSV must include a header and at least 1 row" },
      ],
    };
  }

  const headersRaw = parseCsvLine(rawLines[0]);
  const headers = headersRaw.map(normalizeHeader);

  const errors: Array<{ row: number; message: string }> = [];
  const rows: DepartmentAdminCreateStaffUserInput[] = [];

  for (let index = 1; index < rawLines.length; index++) {
    const values = parseCsvLine(rawLines[index]);
    const record: Record<string, string> = {};

    for (let c = 0; c < headers.length; c++) {
      record[headers[c] ?? `col_${c}`] = values[c] ?? "";
    }

    const rowNumber = index;

    const roleRaw = (record.role || "").trim().toUpperCase();
    const role =
      roleRaw === "STUDENT"
        ? "STUDENT"
        : roleRaw === "LECTURER"
          ? "LECTURER"
          : null;

    const base: DepartmentAdminCreateStaffUserInput = {
      role: role ?? "LECTURER",
      email: (record.email || "").trim().toLowerCase(),
      password: (record.password || "").trim(),
      firstName: (record.firstname || record.first_name || "").trim(),
      lastName: (record.lastname || record.last_name || "").trim(),
      phone: (record.phone || "").trim(),
      employeeId: (record.employeeid || record.employee_id || "").trim(),
      qualification: (record.qualification || "").trim(),
      specialization: (record.specialization || "").trim(),
      office: (record.office || "").trim(),
      studentId: (record.studentid || record.student_id || "").trim(),
      batch: (record.batch || record.level || "").trim(),
    };

    if (!role) {
      errors.push({
        row: rowNumber,
        message: "Invalid role (expected LECTURER or STUDENT)",
      });
      continue;
    }

    if (!base.email || !base.password || !base.firstName || !base.lastName) {
      errors.push({
        row: rowNumber,
        message:
          "Missing required fields (email, password, firstName, lastName)",
      });
      continue;
    }

    if (base.role === "LECTURER") {
      if (!base.employeeId || !base.qualification || !base.specialization) {
        errors.push({
          row: rowNumber,
          message:
            "Missing lecturer fields (employeeId, qualification, specialization)",
        });
        continue;
      }
    }

    rows.push(base);
  }

  return { rows, errors };
}

export function BulkImportModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [parsing, setParsing] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [parsed, setParsed] = useState<ParsedResult>({ rows: [], errors: [] });

  const importMutation = useDepartmentAdminBulkImportStaff();

  const canImport = parsed.rows.length > 0 && !importMutation.isPending;

  const headerHint = useMemo(
    () =>
      [
        "email,password,role,firstName,lastName,phone",
        "employeeId,qualification,specialization,office",
        "studentId,batch",
      ].join("\n"),
    [],
  );

  async function onFilePicked(file: File | null) {
    setParsed({ rows: [], errors: [] });
    setFileName(file?.name ?? null);

    if (!file) return;

    setParsing(true);
    try {
      const text = await file.text();
      const result = parseCsv(text);
      setParsed(result);
      if (result.rows.length) {
        toast.success(`Parsed ${result.rows.length} row(s)`);
      }
      if (result.errors.length) {
        toast.error(`Found ${result.errors.length} error(s) in CSV`);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to parse CSV");
    } finally {
      setParsing(false);
    }
  }

  async function onImport() {
    try {
      const res = await importMutation.mutateAsync(parsed.rows);
      toast.success(
        `Imported: ${res.created} created, ${res.updated} updated, ${res.failed} failed`,
      );
      onOpenChange(false);

      setParsed({ rows: [], errors: [] });
      setFileName(null);
      if (inputRef.current) inputRef.current.value = "";
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Bulk import failed");
    }
  }

  function onClose() {
    setParsed({ rows: [], errors: [] });
    setFileName(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Bulk Import (CSV)</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-sm font-semibold">Upload CSV file</p>
            <p className="mt-1 text-xs text-muted-foreground">
              The first row must be headers. Supported headers:
            </p>
            <pre className="mt-3 overflow-x-auto rounded-lg border border-border bg-background p-3 text-xs text-muted-foreground">
              {headerHint}
            </pre>

            <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Input
                ref={inputRef}
                type="file"
                accept=".csv,text/csv"
                disabled={parsing || importMutation.isPending}
                onChange={(e) => void onFilePicked(e.target.files?.[0] ?? null)}
              />
              <Button
                type="button"
                variant="outline"
                disabled={!fileName || parsing || importMutation.isPending}
                onClick={() => {
                  setParsed({ rows: [], errors: [] });
                  setFileName(null);
                  if (inputRef.current) inputRef.current.value = "";
                }}
              >
                <MaterialSymbol icon="delete" className="text-[18px]" />
                Clear
              </Button>
            </div>

            {fileName ? (
              <p className="mt-2 text-xs text-muted-foreground">{fileName}</p>
            ) : null}
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Parsed
              </p>
              <p className="mt-2 text-2xl font-semibold">
                {parsed.rows.length.toLocaleString()}
              </p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Errors
              </p>
              <p
                className={cn(
                  "mt-2 text-2xl font-semibold",
                  parsed.errors.length ? "text-destructive" : null,
                )}
              >
                {parsed.errors.length.toLocaleString()}
              </p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Status
              </p>
              <p className="mt-2 text-sm font-semibold">
                {parsing
                  ? "Parsing..."
                  : importMutation.isPending
                    ? "Importing..."
                    : "Ready"}
              </p>
            </div>
          </div>

          {parsed.errors.length ? (
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-sm font-semibold">CSV Errors</p>
              <div className="mt-3 max-h-48 space-y-2 overflow-y-auto">
                {parsed.errors.slice(0, 25).map((e, idx) => (
                  <p
                    key={`${e.row}_${idx}`}
                    className="text-xs text-muted-foreground"
                  >
                    Row {e.row}: {e.message}
                  </p>
                ))}
              </div>
              {parsed.errors.length > 25 ? (
                <p className="mt-2 text-xs text-muted-foreground">
                  Showing first 25 errors.
                </p>
              ) : null}
            </div>
          ) : null}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <DialogClose asChild>
            <Button type="button" variant="secondary" onClick={onClose}>
              Close
            </Button>
          </DialogClose>

          <Button
            type="button"
            disabled={!canImport}
            onClick={() => void onImport()}
          >
            <MaterialSymbol icon="upload_file" className="text-[18px]" />
            Import
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
