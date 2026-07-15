"use client";

import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { MaterialSymbol } from "@/components/common/MaterialSymbol";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetEnrollmentDepartments, useGetEnrollmentProgrammes } from "@/services/enrollment/enrollment";
import { useAdminStudentImport, useAdminStudents } from "@/services/admin/students/students";
import type { AdminStudentImportResult, AdminStudentImportRow } from "@/types";

const csvHeaders = [
  "email",
  "firstName",
  "lastName",
  "phone",
  "studentId",
  "batch",
  "departmentCode",
  "programmeCode",
  "password",
] as const;

function parseCsvLine(line: string): string[] {
  const values: string[] = [];
  let current = "";
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    if (character === '"') {
      if (quoted && line[index + 1] === '"') {
        current += '"';
        index += 1;
      } else quoted = !quoted;
    } else if (character === "," && !quoted) {
      values.push(current.trim());
      current = "";
    } else current += character;
  }
  values.push(current.trim());
  return values;
}

function parseStudentCsv(text: string): AdminStudentImportRow[] {
  const lines = text.split(/\r?\n/).filter((line) => line.trim());
  if (lines.length < 2) throw new Error("CSV must include headers and at least one student");
  const headers = parseCsvLine(lines[0]).map((header) => header.trim().toLowerCase());
  const required = ["email", "firstname", "lastname", "studentid", "batch", "departmentcode", "programmecode"];
  if (required.some((header) => !headers.includes(header))) {
    throw new Error("CSV is missing one or more required headers");
  }
  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line);
    const record = Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""]));
    return {
      email: record.email ?? "",
      firstName: record.firstname ?? "",
      lastName: record.lastname ?? "",
      phone: record.phone || undefined,
      studentId: record.studentid ?? "",
      batch: record.batch ?? "",
      departmentCode: record.departmentcode ?? "",
      programmeCode: record.programmecode ?? "",
      password: record.password || undefined,
    };
  });
}

function downloadCsv(filename: string, lines: string[]) {
  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function StudentImportDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<AdminStudentImportRow[]>([]);
  const [fileName, setFileName] = useState("");
  const [result, setResult] = useState<AdminStudentImportResult | null>(null);
  const importMutation = useAdminStudentImport();

  async function pickFile(file: File | null) {
    setRows([]);
    setResult(null);
    setFileName(file?.name ?? "");
    if (!file) return;
    try {
      const parsed = parseStudentCsv(await file.text());
      setRows(parsed);
      toast.success(`Parsed ${parsed.length} student row(s)`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to parse CSV");
    }
  }

  async function runImport() {
    try {
      const imported = await importMutation.mutateAsync(rows);
      setResult(imported);
      toast.success(`${imported.created} created, ${imported.updated} updated, ${imported.failed} failed`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Student import failed");
    }
  }

  function downloadTemplate() {
    downloadCsv("usted-student-import-template.csv", [
      csvHeaders.join(","),
      "student.csc01@usted.edu.gh,Ama,Mensah,0240000000,USTED-2026-001,2026,FASME,BSc-CSC,",
    ]);
  }

  function downloadCredentials() {
    if (!result?.credentials.length) return;
    downloadCsv("usted-imported-student-credentials.csv", [
      "email,studentId,password",
      ...result.credentials.map((credential) =>
        [credential.email, credential.studentId, credential.password]
          .map((value) => `"${value.replaceAll('"', '""')}"`)
          .join(","),
      ),
    ]);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader><DialogTitle>Import Students</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <div>
                <p className="text-sm font-semibold">Student roster CSV</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Password is optional. New accounts without one receive a generated temporary password.
                </p>
              </div>
              <Button type="button" variant="outline" onClick={downloadTemplate}>
                <MaterialSymbol icon="download" className="text-[18px]" /> Template
              </Button>
            </div>
            <Input
              ref={inputRef}
              className="mt-4"
              type="file"
              accept=".csv,text/csv"
              onChange={(event) => void pickFile(event.target.files?.[0] ?? null)}
              disabled={importMutation.isPending}
            />
            {fileName ? <p className="mt-2 text-xs text-muted-foreground">{fileName}</p> : null}
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl border p-4"><p className="text-xs text-muted-foreground">Parsed</p><p className="mt-1 text-2xl font-semibold">{rows.length}</p></div>
            <div className="rounded-xl border p-4"><p className="text-xs text-muted-foreground">Created</p><p className="mt-1 text-2xl font-semibold">{result?.created ?? 0}</p></div>
            <div className="rounded-xl border p-4"><p className="text-xs text-muted-foreground">Failed</p><p className="mt-1 text-2xl font-semibold">{result?.failed ?? 0}</p></div>
          </div>

          {result?.errors.length ? (
            <div className="max-h-44 overflow-y-auto rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-xs">
              {result.errors.map((error, index) => <p key={`${error.row}-${index}`}>Row {error.row}: {error.message}</p>)}
            </div>
          ) : null}

          <div className="flex flex-col justify-end gap-2 sm:flex-row">
            {result?.credentials.length ? (
              <Button type="button" variant="outline" onClick={downloadCredentials}>
                <MaterialSymbol icon="key" className="text-[18px]" /> Download credentials
              </Button>
            ) : null}
            <Button type="button" disabled={!rows.length || importMutation.isPending} onClick={() => void runImport()}>
              <MaterialSymbol icon="upload_file" className="text-[18px]" />
              {importMutation.isPending ? "Importing..." : "Import students"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function StudentProfilesPage() {
  const [q, setQ] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [programmeId, setProgrammeId] = useState("");
  const [status, setStatus] = useState("ALL");
  const [page, setPage] = useState(1);
  const [importOpen, setImportOpen] = useState(false);
  const departments = useGetEnrollmentDepartments();
  const programmes = useGetEnrollmentProgrammes(departmentId || null);
  const params = useMemo(
    () => ({ q: q.trim() || undefined, departmentId: departmentId || undefined, programmeId: programmeId || undefined, status, page, pageSize: 25 }),
    [departmentId, page, programmeId, q, status],
  );
  const students = useAdminStudents(params);
  const rows = students.data?.rows ?? [];
  const stats = students.data?.stats;
  const totalPages = Math.max(1, Math.ceil((students.data?.total ?? 0) / (students.data?.pageSize ?? 25)));

  return (
    <section className="space-y-6">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Academic Management</p>
          <h1 className="mt-1 font-display text-2xl font-semibold">Students</h1>
          <p className="mt-1 text-sm text-muted-foreground">Search student profiles and provision approved portal accounts.</p>
        </div>
        <Button type="button" onClick={() => setImportOpen(true)}>
          <MaterialSymbol icon="upload_file" className="text-[18px]" /> Bulk import
        </Button>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Total Students", stats?.total ?? 0, "groups"],
          ["Approved", stats?.approved ?? 0, "verified"],
          ["Pending", stats?.pending ?? 0, "pending_actions"],
          ["Active", stats?.active ?? 0, "person_check"],
        ].map(([label, value, icon]) => (
          <div key={String(label)} className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center justify-between"><p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p><MaterialSymbol icon={String(icon)} /></div>
            <p className="mt-3 text-3xl font-semibold">{Number(value).toLocaleString()}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-3 rounded-xl border border-border bg-card p-4 md:grid-cols-4">
        <Input value={q} onChange={(event) => { setQ(event.target.value); setPage(1); }} placeholder="Search name, email or student ID" />
        <select className="h-9 rounded-md border border-input bg-background px-3 text-sm" value={departmentId} onChange={(event) => { setDepartmentId(event.target.value); setProgrammeId(""); setPage(1); }}>
          <option value="">All departments</option>
          {(departments.data ?? []).map((department) => <option key={department.id} value={department.id}>{department.name}</option>)}
        </select>
        <select className="h-9 rounded-md border border-input bg-background px-3 text-sm disabled:opacity-60" value={programmeId} disabled={!departmentId} onChange={(event) => { setProgrammeId(event.target.value); setPage(1); }}>
          <option value="">All programmes</option>
          {(programmes.data ?? []).map((programme) => <option key={programme.id} value={programme.id}>{programme.name}</option>)}
        </select>
        <select className="h-9 rounded-md border border-input bg-background px-3 text-sm" value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }}>
          <option value="ALL">Any status</option><option value="APPROVED">Approved</option><option value="SUBMITTED">Submitted</option><option value="UNDER_REVIEW">Under review</option><option value="REJECTED">Rejected</option>
        </select>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground"><tr><th className="px-5 py-4">Student</th><th className="px-5 py-4">Student ID</th><th className="px-5 py-4">Department</th><th className="px-5 py-4">Programme</th><th className="px-5 py-4">Status</th></tr></thead>
            <tbody className="divide-y divide-border">
              {students.isPending ? Array.from({ length: 6 }).map((_, index) => <tr key={index}>{Array.from({ length: 5 }).map((__, cell) => <td key={cell} className="px-5 py-4"><Skeleton className="h-5 w-28" /></td>)}</tr>) : rows.length ? rows.map((row) => (
                <tr key={row.id} className="hover:bg-muted/20">
                  <td className="px-5 py-4"><p className="font-semibold">{row.name}</p><p className="text-xs text-muted-foreground">{row.email}</p></td>
                  <td className="px-5 py-4"><p>{row.studentId}</p><p className="text-xs text-muted-foreground">Batch {row.batch}</p></td>
                  <td className="px-5 py-4">{row.departmentName ?? "—"}</td><td className="px-5 py-4">{row.programmeName ?? "—"}</td>
                  <td className="px-5 py-4"><span className="rounded-full bg-muted px-2.5 py-1 text-xs font-semibold">{row.applicationStatus?.replaceAll("_", " ") ?? "NO APPLICATION"}</span></td>
                </tr>
              )) : <tr><td colSpan={5} className="px-5 py-16 text-center text-muted-foreground">No students match these filters.</td></tr>}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between border-t border-border px-5 py-4 text-sm">
          <p className="text-muted-foreground">Page {page} of {totalPages}</p>
          <div className="flex gap-2"><Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>Previous</Button><Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => setPage((value) => value + 1)}>Next</Button></div>
        </div>
      </div>

      <StudentImportDialog open={importOpen} onOpenChange={setImportOpen} />
    </section>
  );
}
