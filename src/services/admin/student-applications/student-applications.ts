import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import api from "@/lib/axios";
import { toApiClientError } from "@/lib/api-client-error";
import type {
	AdminStudentApplicationDetail,
	AdminStudentApplicationsListResult,
	ApiResponse,
} from "@/types";

export type AdminStudentApplicationsListParams = {
	q?: string;
	departmentId?: string;
	programmeId?: string;
	status?: string;
	take?: number;
};

const studentApplicationKeys = {
	all: ["admin", "student-applications"] as const,
	list: (params: AdminStudentApplicationsListParams) =>
		["admin", "student-applications", "list", params] as const,
	detail: (applicationId: string) =>
		["admin", "student-applications", "detail", applicationId] as const,
};

async function getApplications(
	params: AdminStudentApplicationsListParams,
): Promise<AdminStudentApplicationsListResult> {
	try {
		const res = await api.get<ApiResponse<AdminStudentApplicationsListResult>>(
			"/administrator/student-applications",
			{ params },
		);

		if (!res.data.success || !res.data.data) {
			throw new Error(res.data.message || "Failed to load applications");
		}

		return res.data.data;
	} catch (error) {
		throw toApiClientError(error, "Failed to load applications");
	}
}

async function getApplicationDetail(
	applicationId: string,
): Promise<AdminStudentApplicationDetail> {
	try {
		const res = await api.get<ApiResponse<AdminStudentApplicationDetail>>(
			`/administrator/student-applications/${applicationId}`,
		);

		if (!res.data.success || !res.data.data) {
			throw new Error(res.data.message || "Failed to load application");
		}

		return res.data.data;
	} catch (error) {
		throw toApiClientError(error, "Failed to load application");
	}
}

async function approveApplication(applicationId: string): Promise<void> {
	try {
		const res = await api.post<ApiResponse<{ ok: true }>>(
			`/administrator/student-applications/${applicationId}/approve`,
		);

		if (!res.data.success) {
			throw new Error(res.data.message || "Failed to approve application");
		}
	} catch (error) {
		throw toApiClientError(error, "Failed to approve application");
	}
}

async function rejectApplication(args: {
	applicationId: string;
	reason: string;
}): Promise<void> {
	try {
		const res = await api.post<ApiResponse<{ ok: true }>>(
			`/administrator/student-applications/${args.applicationId}/reject`,
			{ reason: args.reason },
		);

		if (!res.data.success) {
			throw new Error(res.data.message || "Failed to reject application");
		}
	} catch (error) {
		throw toApiClientError(error, "Failed to reject application");
	}
}

export function useAdminStudentApplicationsList(
	params: AdminStudentApplicationsListParams,
) {
	return useQuery({
		queryKey: studentApplicationKeys.list(params),
		queryFn: () => getApplications(params),
		staleTime: 15 * 1000,
	});
}

export function useAdminStudentApplicationDetail(applicationId: string | null) {
	return useQuery({
		queryKey: applicationId
			? studentApplicationKeys.detail(applicationId)
			: ["admin", "student-applications", "detail", null],
		queryFn: () => {
			if (!applicationId) throw new Error("Missing applicationId");
			return getApplicationDetail(applicationId);
		},
		enabled: Boolean(applicationId),
		staleTime: 15 * 1000,
	});
}

export function useApproveStudentApplication() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: approveApplication,
		onSuccess: async () => {
			await queryClient.invalidateQueries({
				queryKey: studentApplicationKeys.all,
			});
		},
	});
}

export function useRejectStudentApplication() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: rejectApplication,
		onSuccess: async () => {
			await queryClient.invalidateQueries({
				queryKey: studentApplicationKeys.all,
			});
		},
	});
}

export { studentApplicationKeys };
