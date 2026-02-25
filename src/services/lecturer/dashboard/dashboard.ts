import { useQuery } from "@tanstack/react-query";

import api from "@/lib/axios";
import { toApiClientError } from "@/lib/api-client-error";
import type { ApiResponse } from "@/types";

import type { LecturerDashboardAnalyticsResponse } from "@/app/api/lecturer/dashboard/route";

const dashboardKeys = {
  analytics: ["lecturer-dashboard", "analytics"] as const,
};

async function getLecturerDashboardAnalytics(): Promise<LecturerDashboardAnalyticsResponse> {
  try {
    const res = await api.get<ApiResponse<LecturerDashboardAnalyticsResponse>>(
      "/lecturer/dashboard",
    );

    if (!res.data.success || !res.data.data) {
      throw new Error(res.data.message || "Failed to load dashboard");
    }

    return res.data.data;
  } catch (error) {
    throw toApiClientError(error, "Failed to load dashboard");
  }
}

export function useLecturerDashboardAnalytics() {
  return useQuery({
    queryKey: dashboardKeys.analytics,
    queryFn: getLecturerDashboardAnalytics,
    staleTime: 30 * 1000,
  });
}

export { dashboardKeys };
