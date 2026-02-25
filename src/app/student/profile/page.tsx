"use client";

import { getApiErrorLabel } from "@/lib/api-client-error";
import { ProfilePageShell } from "@/components/common/ProfilePageShell";
import { useStudentProfile } from "@/services/student/profile/profile";

export default function StudentProfilePage() {
  const query = useStudentProfile();
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
          { label: "Student ID", value: query.data.studentId },
          { label: "Batch", value: query.data.batch },
        ],
      }
    : null;

  return (
    <ProfilePageShell
      title="Profile & Settings"
      loading={query.isPending}
      error={error}
      actions={[]}
      data={data}
    />
  );
}
