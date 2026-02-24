import { useQuery } from "@tanstack/react-query";

import api from "@/lib/axios";
import { toApiClientError } from "@/lib/api-client-error";
import type { ApiResponse } from "@/types";

import type { AdminProfileResponse } from "@/app/api/administrator/profile/route";

async function fetchAdminProfile(): Promise<AdminProfileResponse> {
	try {
		const res = await api.get<ApiResponse<AdminProfileResponse>>("/administrator/profile");
		if (!res.data.success || !res.data.data) {
			throw new Error(res.data.message || "Failed to load profile");
		}
		return res.data.data;
	} catch (error) {
		throw toApiClientError(error, "Failed to load profile");
	}
}

export function useAdminProfile() {
	return useQuery({
		queryKey: ["administrator", "profile"],
		queryFn: fetchAdminProfile,
		staleTime: 30 * 1000,
	});
}

