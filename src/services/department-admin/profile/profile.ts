import { useQuery } from "@tanstack/react-query";

import api from "@/lib/axios";
import { toApiClientError } from "@/lib/api-client-error";
import type { ApiResponse } from "@/types";

import type { DepartmentAdminProfileResponse } from "@/app/api/department-admin/profile/route";

async function fetchDepartmentAdminProfile(): Promise<DepartmentAdminProfileResponse> {
	try {
		const res = await api.get<ApiResponse<DepartmentAdminProfileResponse>>("/department-admin/profile");
		if (!res.data.success || !res.data.data) {
			throw new Error(res.data.message || "Failed to load profile");
		}
		return res.data.data;
	} catch (error) {
		throw toApiClientError(error, "Failed to load profile");
	}
}

export function useDepartmentAdminProfile() {
	return useQuery({
		queryKey: ["department-admin", "profile"],
		queryFn: fetchDepartmentAdminProfile,
		staleTime: 30 * 1000,
	});
}

