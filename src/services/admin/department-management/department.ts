import api from "@/lib/axios";
import type {
  ApiResponse,
  CreateDepartmentInput,
  DepartmentHeadCandidate,
  DepartmentInfoResponse,
  DepartmentSummary,
  UpdateDepartmentHodInput,
} from "@/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

const departmentKeys = {
  info: ["departments", "info"] as const,
  heads: ["departments", "heads"] as const,
};

async function getDepartmentInfo(): Promise<DepartmentInfoResponse> {
  const response = await api.get<ApiResponse<DepartmentInfoResponse>>(
    "/administrators/departments/get-department-info",
  );

  if (!response.data.success || !response.data.data) {
    throw new Error(
      response.data.message || "Failed to load department information",
    );
  }

  return response.data.data;
}

async function getDepartmentHeads(): Promise<DepartmentHeadCandidate[]> {
  const response = await api.get<ApiResponse<DepartmentHeadCandidate[]>>(
    "/administrators/departments/get-department-heads",
  );

  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.message || "Failed to load department heads");
  }

  return response.data.data;
}

async function updateDepartmentHod(
  input: UpdateDepartmentHodInput,
): Promise<DepartmentSummary> {
  const response = await api.patch<ApiResponse<DepartmentSummary>>(
    "/administrators/departments/update-hod",
    input,
  );

  if (!response.data.success || !response.data.data) {
    throw new Error(
      response.data.message || "Failed to update department head",
    );
  }

  return response.data.data;
}

async function createDepartment(
  input: CreateDepartmentInput,
): Promise<DepartmentSummary> {
  const response = await api.post<ApiResponse<DepartmentSummary>>(
    "/administrators/departments/create-department",
    input,
  );

  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.message || "Failed to create department");
  }

  return response.data.data;
}

export function useGetDepartmentInfo() {
  return useQuery({
    queryKey: departmentKeys.info,
    queryFn: getDepartmentInfo,
    staleTime: 5 * 60 * 1000,
  });
}

export function useGetDepartmentHeads() {
  return useQuery({
    queryKey: departmentKeys.heads,
    queryFn: getDepartmentHeads,
    staleTime: 5 * 60 * 1000,
  });
}

export function useUpdateDepartmentHod() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateDepartmentHod,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: departmentKeys.info });
    },
  });
}

export function useCreateDepartment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createDepartment,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: departmentKeys.info });
    },
  });
}
