import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/server";
import { provisionApprovedStudent } from "@/lib/student-provisioning";
import { validateStudentImportRows } from "@/lib/student-import-validation";
import type { AdminStudentImportResult, AdminStudentImportRow, ApiResponse } from "@/types";

export async function POST(request: Request) {
  try {
    const session = await requireAdmin(request);
    const body = (await request.json().catch(() => null)) as { rows?: AdminStudentImportRow[] } | null;
    const rows = Array.isArray(body?.rows) ? body.rows.slice(0, 500) : [];
    if (!rows.length) {
      return NextResponse.json(
        { success: false, message: "No student rows were provided", code: "NO_ROWS" } satisfies ApiResponse<never>,
        { status: 400 },
      );
    }

    const validationErrors = validateStudentImportRows(rows);
    const invalidRows = new Set(validationErrors.map((error) => error.row));
    const result: AdminStudentImportResult = {
      created: 0,
      updated: 0,
      failed: invalidRows.size,
      errors: [...validationErrors],
      credentials: [],
    };

    for (let index = 0; index < rows.length; index += 1) {
      const rowNumber = index + 1;
      if (invalidRows.has(rowNumber)) continue;
      try {
        const provisioned = await provisionApprovedStudent({
          row: rows[index],
          actorId: session.user.id,
        });
        if (provisioned.created) result.created += 1;
        else result.updated += 1;
        if (provisioned.credential) result.credentials.push(provisioned.credential);
      } catch (error) {
        result.failed += 1;
        result.errors.push({
          row: rowNumber,
          message: error instanceof Error ? error.message : "Import failed",
        });
      }
    }

    return NextResponse.json({ success: true, data: result } satisfies ApiResponse<AdminStudentImportResult>);
  } catch (error) {
    if (error instanceof Response) {
      return NextResponse.json(
        { success: false, message: error.status === 401 ? "Unauthorized" : "Forbidden" } satisfies ApiResponse<never>,
        { status: error.status },
      );
    }
    return NextResponse.json(
      { success: false, message: "Student import failed", code: "STUDENT_IMPORT_FAILED" } satisfies ApiResponse<never>,
      { status: 500 },
    );
  }
}
