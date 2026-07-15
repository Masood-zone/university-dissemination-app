import type { AdminStudentImportRow } from "@/types";

export function normalizeStudentImportRow(
  row: AdminStudentImportRow,
): AdminStudentImportRow {
  return {
    email: row.email.trim().toLowerCase(),
    firstName: row.firstName.trim(),
    lastName: row.lastName.trim(),
    phone: row.phone?.trim() || undefined,
    studentId: row.studentId.trim().toUpperCase(),
    batch: row.batch.trim(),
    departmentCode: row.departmentCode.trim().toUpperCase(),
    programmeCode: row.programmeCode.trim().toUpperCase(),
    password: row.password?.trim() || undefined,
  };
}

export function validateStudentImportRows(
  rows: AdminStudentImportRow[],
): Array<{ row: number; message: string }> {
  const errors: Array<{ row: number; message: string }> = [];
  const emailRows = new Map<string, number>();
  const studentIdRows = new Map<string, number>();

  rows.forEach((raw, index) => {
    const rowNumber = index + 1;
    const row = normalizeStudentImportRow(raw);
    if (
      !row.email ||
      !row.firstName ||
      !row.lastName ||
      !row.studentId ||
      !row.batch ||
      !row.departmentCode ||
      !row.programmeCode
    ) {
      errors.push({ row: rowNumber, message: "Missing required student fields" });
    }
    if (!/^\S+@\S+\.\S+$/.test(row.email)) {
      errors.push({ row: rowNumber, message: "Invalid email address" });
    }
    if (row.password && row.password.length < 8) {
      errors.push({ row: rowNumber, message: "Password must be at least 8 characters" });
    }
    const previousEmail = emailRows.get(row.email);
    if (previousEmail) {
      errors.push({ row: rowNumber, message: `Duplicate email from row ${previousEmail}` });
    } else if (row.email) {
      emailRows.set(row.email, rowNumber);
    }
    const previousStudentId = studentIdRows.get(row.studentId);
    if (previousStudentId) {
      errors.push({
        row: rowNumber,
        message: `Duplicate student ID from row ${previousStudentId}`,
      });
    } else if (row.studentId) {
      studentIdRows.set(row.studentId, rowNumber);
    }
  });

  return errors;
}
