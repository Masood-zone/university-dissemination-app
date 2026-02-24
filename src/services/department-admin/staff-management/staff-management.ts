import api from "@/lib/axios";
import type {
  ApiResponse,
  DepartmentAdminBulkImportResult,
  DepartmentAdminStaffUserDetail,
  DepartmentAdminStaffListResult,
  DepartmentAdminCreateStaffUserInput,
  DepartmentAdminUpdateStaffUserInput,
  DepartmentAdminStaffRoleFilter,
  DepartmentAdminStaffStatusFilter,
} from "@/types";
import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryResult,
} from "@tanstack/react-query";

export type DepartmentAdminStaffListParams = {
  search?: string;
  role?: DepartmentAdminStaffRoleFilter;
  status?: DepartmentAdminStaffStatusFilter;
  page?: number;
  limit?: number;
};

async function fetchStaffList(
  params: DepartmentAdminStaffListParams,
): Promise<DepartmentAdminStaffListResult> {
  const response = await api.get<ApiResponse<DepartmentAdminStaffListResult>>(
    "/department-admin/staff-management/users",
    {
      params,
    },
  );

  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.message || "Failed to load staff list");
  }

  return response.data.data;
}

export function useDepartmentAdminStaffList(
  params: DepartmentAdminStaffListParams,
): UseQueryResult<DepartmentAdminStaffListResult> {
  return useQuery({
    queryKey: ["deptAdminStaff", params],
    queryFn: () => fetchStaffList(params),
    staleTime: 30 * 1000,
  });
}

export function useDepartmentAdminCreateStaffUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: DepartmentAdminCreateStaffUserInput) => {
      const response = await api.post<ApiResponse<{ id: string }>>(
        "/department-admin/staff-management/users",
        input,
      );

      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.message || "Failed to create user");
      }

      return response.data.data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["deptAdminStaff"] });
    },
  });
}

export function useDepartmentAdminUpdateStaffUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      input,
    }: {
      id: string;
      input: DepartmentAdminUpdateStaffUserInput;
    }) => {
      const response = await api.patch<ApiResponse<{ id: string }>>(
        `/department-admin/staff-management/users/${id}`,
        input,
      );

      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.message || "Failed to update user");
      }

      return response.data.data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["deptAdminStaff"] });
    },
  });
}

export function useDepartmentAdminBulkImportStaff() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (rows: DepartmentAdminCreateStaffUserInput[]) => {
      const response = await api.post<
        ApiResponse<DepartmentAdminBulkImportResult>
      >("/department-admin/staff-management/import", { rows });

      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.message || "Bulk import failed");
      }

      return response.data.data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["deptAdminStaff"] });
    },
  });
}

async function fetchStaffUserDetail(
  id: string,
): Promise<DepartmentAdminStaffUserDetail> {
  const response = await api.get<ApiResponse<DepartmentAdminStaffUserDetail>>(
    `/department-admin/staff-management/users/${id}`,
  );

  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.message || "Failed to load user");
  }

  return response.data.data;
}

export function useDepartmentAdminStaffUserDetail(
  id: string | null,
  enabled: boolean,
) {
  return useQuery({
    queryKey: ["deptAdminStaffUser", id],
    queryFn: () => fetchStaffUserDetail(id as string),
    enabled: Boolean(id) && enabled,
    staleTime: 30 * 1000,
  });
}
