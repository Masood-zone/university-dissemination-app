import api from "@/lib/axios";
import type { AdminOverviewData, ApiResponse } from "@/types";
import { useQuery } from "@tanstack/react-query";

async function fetchDashboardData(): Promise<AdminOverviewData> {
  const response = await api.get<ApiResponse<AdminOverviewData>>(
    "/administrator/dashboard",
  );

  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.message || "Failed to load dashboard data");
  }

  return response.data.data;
}

export function useGetDashboardData() {
  return useQuery({
    queryKey: ["adminDashboardData"],
    queryFn: fetchDashboardData,
    staleTime: 5 * 60 * 1000, // Cache data for 5 minutes
  });
}
