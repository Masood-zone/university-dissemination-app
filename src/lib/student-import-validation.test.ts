import assert from "node:assert/strict";
import test from "node:test";

import {
  normalizeStudentImportRow,
  validateStudentImportRows,
} from "@/lib/student-import-validation";
import type { AdminStudentImportRow } from "@/types";

const validRow: AdminStudentImportRow = {
  email: "student@example.com",
  firstName: "Ama",
  lastName: "Mensah",
  studentId: "USTED-2026-001",
  batch: "2026",
  departmentCode: "FASME",
  programmeCode: "BSc-CSC",
};

test("normalizes identity fields consistently", () => {
  const normalized = normalizeStudentImportRow({
    ...validRow,
    email: " Student@Example.COM ",
    studentId: " usted-2026-001 ",
    departmentCode: " fasme ",
    programmeCode: " bsc-csc ",
  });
  assert.equal(normalized.email, "student@example.com");
  assert.equal(normalized.studentId, "USTED-2026-001");
  assert.equal(normalized.departmentCode, "FASME");
  assert.equal(normalized.programmeCode, "BSC-CSC");
});

test("accepts a complete student row", () => {
  assert.deepEqual(validateStudentImportRows([validRow]), []);
});

test("reports duplicate emails and student IDs by row", () => {
  const errors = validateStudentImportRows([
    validRow,
    { ...validRow, email: "STUDENT@example.com" },
  ]);
  assert.ok(errors.some((error) => error.row === 2 && error.message.includes("Duplicate email")));
  assert.ok(errors.some((error) => error.row === 2 && error.message.includes("Duplicate student ID")));
});

test("rejects incomplete rows and weak supplied passwords", () => {
  const errors = validateStudentImportRows([
    { ...validRow, programmeCode: "", password: "short" },
  ]);
  assert.ok(errors.some((error) => error.message === "Missing required student fields"));
  assert.ok(errors.some((error) => error.message.includes("at least 8")));
});
