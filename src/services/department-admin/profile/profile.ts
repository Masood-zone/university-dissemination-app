import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

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

export type UpdateDepartmentAdminProfileInput = {
	firstName: string;
	lastName: string;
	phone?: string | null;
};

async function updateDepartmentAdminProfile(
	input: UpdateDepartmentAdminProfileInput,
): Promise<DepartmentAdminProfileResponse> {
	try {
		const res = await api.patch<ApiResponse<DepartmentAdminProfileResponse>>(
			"/department-admin/profile",
			{
				firstName: input.firstName,
				lastName: input.lastName,
				phone: input.phone ?? null,
			},
		);
		if (!res.data.success || !res.data.data) {
			throw new Error(res.data.message || "Failed to update profile");
		}
		return res.data.data;
	} catch (error) {
		throw toApiClientError(error, "Failed to update profile");
	}
}

export function useUpdateDepartmentAdminProfile() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: updateDepartmentAdminProfile,
		onSuccess: async () => {
			await queryClient.invalidateQueries({
				queryKey: ["department-admin", "profile"],
			});
		},
	});
}

export type ChangeDepartmentAdminPasswordInput = {
	currentPassword: string;
	newPassword: string;
};

async function changeDepartmentAdminPassword(
	input: ChangeDepartmentAdminPasswordInput,
): Promise<void> {
	try {
		const res = await api.post<ApiResponse<null>>(
			"/department-admin/profile/change-password",
			input,
		);
		if (!res.data.success) {
			throw new Error(res.data.message || "Failed to change password");
		}
	} catch (error) {
		throw toApiClientError(error, "Failed to change password");
	}
}

export function useChangeDepartmentAdminPassword() {
	return useMutation({
		mutationFn: changeDepartmentAdminPassword,
	});
}

