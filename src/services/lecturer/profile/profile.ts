import { useQuery } from "@tanstack/react-query";

import api from "@/lib/axios";
import { toApiClientError } from "@/lib/api-client-error";
import type { ApiResponse } from "@/types";

import type { LecturerProfileResponse } from "@/app/api/lecturer/profile/route";

async function fetchLecturerProfile(): Promise<LecturerProfileResponse> {
	try {
		const res = await api.get<ApiResponse<LecturerProfileResponse>>("/lecturer/profile");
		if (!res.data.success || !res.data.data) {
			throw new Error(res.data.message || "Failed to load profile");
		}
		return res.data.data;
	} catch (error) {
		throw toApiClientError(error, "Failed to load profile");
	}
}

export function useLecturerProfile() {
	return useQuery({
		queryKey: ["lecturer", "profile"],
		queryFn: fetchLecturerProfile,
		staleTime: 30 * 1000,
	});
}

