import { useQuery } from "@tanstack/react-query";

import api from "@/lib/axios";
import { toApiClientError } from "@/lib/api-client-error";
import type { ApiResponse } from "@/types";

import type { StudentProfileResponse } from "@/app/api/student/profile/route";

async function fetchStudentProfile(): Promise<StudentProfileResponse> {
	try {
		const res = await api.get<ApiResponse<StudentProfileResponse>>("/student/profile");
		if (!res.data.success || !res.data.data) {
			throw new Error(res.data.message || "Failed to load profile");
		}
		return res.data.data;
	} catch (error) {
		throw toApiClientError(error, "Failed to load profile");
	}
}

export function useStudentProfile() {
	return useQuery({
		queryKey: ["student", "profile"],
		queryFn: fetchStudentProfile,
		staleTime: 30 * 1000,
	});
}

