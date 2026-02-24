"use client";

import { getApiErrorLabel } from "@/lib/api-client-error";
import { ProfilePageShell } from "@/components/common/ProfilePageShell";
import { useLecturerProfile } from "@/services/lecturer/profile/profile";

export default function LecturerProfilePage() {
	const query = useLecturerProfile();
	const error = query.error ? getApiErrorLabel(query.error).message : null;

	const data = query.data
		? {
				name: query.data.name,
				subtitle: `${query.data.roleLabel}${
					query.data.departmentName ? ` · ${query.data.departmentName}` : ""
				}`,
				email: query.data.email,
				phone: query.data.phone,
				departmentName: query.data.departmentName,
				avatarUrl: query.data.avatar,
				emailVerified: query.data.emailVerified,
				lastLogin: query.data.lastLogin,
				primaryMeta: [
					{ label: "Staff ID", value: query.data.employeeId },
					{ label: "Qualification", value: query.data.qualification },
					{ label: "Specialization", value: query.data.specialization },
					{ label: "Office", value: query.data.office },
				],
			}
		: null;

	return (
		<ProfilePageShell
			title="Profile & Settings"
			loading={query.isPending}
			error={error}
			data={data}
		/>
	);
}

