import { ReactNode } from "react";
import AdminLayoutShell from "@/components/admin/AdminLayoutShell";

export default function AdministratorLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <AdminLayoutShell>{children}</AdminLayoutShell>;
}
