"use client";

import { getApiErrorLabel } from "@/lib/api-client-error";
import { ProfilePageShell } from "@/components/common/ProfilePageShell";
import { useAdminProfile } from "@/services/admin/profile/profile";

export default function AdministratorProfilePage() {
	const query = useAdminProfile();
	const error = query.error ? getApiErrorLabel(query.error).message : null;

	const data = query.data
		? {
				name: query.data.name,
				subtitle: query.data.roleLabel,
				email: query.data.email,
				phone: query.data.phone,
				departmentName: query.data.departmentName,
				avatarUrl: query.data.avatar,
				emailVerified: query.data.emailVerified,
				lastLogin: query.data.lastLogin,
				primaryMeta: [{ label: "Role", value: query.data.roleLabel }],
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

