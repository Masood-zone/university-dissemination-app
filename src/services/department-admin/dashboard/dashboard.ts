import api from "@/lib/axios";
import type { ApiResponse, DepartmentAdminOverviewData } from "@/types";
import { useQuery } from "@tanstack/react-query";

async function fetchDepartmentAdminDashboardData(): Promise<DepartmentAdminOverviewData> {
  const response = await api.get<ApiResponse<DepartmentAdminOverviewData>>(
    "/department-admin/dashboard",
  );

  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.message || "Failed to load dashboard data");
  }

  return response.data.data;
}

export function useGetDepartmentAdminDashboardData() {
  return useQuery({
    queryKey: ["departmentAdminDashboard"],
    queryFn: fetchDepartmentAdminDashboardData,
    staleTime: 5 * 60 * 1000,
  });
}
