import { useQuery } from "@tanstack/react-query";

import api from "@/lib/axios";
import { toApiClientError } from "@/lib/api-client-error";
import type { ApiResponse, StudentDashboardAnalytics } from "@/types";

const dashboardKeys = {
	analytics: ["student-dashboard", "analytics"] as const,
};

async function getStudentDashboardAnalytics(): Promise<StudentDashboardAnalytics> {
	try {
		const res = await api.get<ApiResponse<StudentDashboardAnalytics>>(
			"/student/dashboard",
		);

		if (!res.data.success || !res.data.data) {
			throw new Error(res.data.message || "Failed to load dashboard");
		}

		return res.data.data;
	} catch (error) {
		throw toApiClientError(error, "Failed to load dashboard");
	}
}

export function useStudentDashboardAnalytics(enabled: boolean) {
	return useQuery({
		queryKey: dashboardKeys.analytics,
		queryFn: getStudentDashboardAnalytics,
		enabled,
		staleTime: 30 * 1000,
	});
}

