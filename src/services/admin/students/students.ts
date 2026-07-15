import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import api from "@/lib/axios";
import { toApiClientError } from "@/lib/api-client-error";
import type { AdminStudentImportResult, AdminStudentImportRow, AdminStudentListResult, ApiResponse } from "@/types";

export type AdminStudentListParams = {
  q?: string;
  departmentId?: string;
  programmeId?: string;
  status?: string;
  page: number;
  pageSize: number;
};

const studentKeys = {
  all: ["admin", "students"] as const,
  list: (params: AdminStudentListParams) => ["admin", "students", "list", params] as const,
};

async function getStudents(params: AdminStudentListParams): Promise<AdminStudentListResult> {
  try {
    const response = await api.get<ApiResponse<AdminStudentListResult>>("/administrator/students", { params });
    if (!response.data.success || !response.data.data) throw new Error(response.data.message || "Failed to load students");
    return response.data.data;
  } catch (error) {
    throw toApiClientError(error, "Failed to load students");
  }
}

async function importStudents(rows: AdminStudentImportRow[]): Promise<AdminStudentImportResult> {
  try {
    const response = await api.post<ApiResponse<AdminStudentImportResult>>("/administrator/students/import", { rows });
    if (!response.data.success || !response.data.data) throw new Error(response.data.message || "Failed to import students");
    return response.data.data;
  } catch (error) {
    throw toApiClientError(error, "Failed to import students");
  }
}

export function useAdminStudents(params: AdminStudentListParams) {
  return useQuery({
    queryKey: studentKeys.list(params),
    queryFn: () => getStudents(params),
    placeholderData: keepPreviousData,
    staleTime: 15_000,
  });
}

export function useAdminStudentImport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: importStudents,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: studentKeys.all }),
  });
}
