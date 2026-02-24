import { ReactNode } from "react";

import DepartmentAdminLayoutShell from "@/components/department-admin/DepartmentAdminLayoutShell";

export default function DepartmentAdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <DepartmentAdminLayoutShell>{children}</DepartmentAdminLayoutShell>;
}
