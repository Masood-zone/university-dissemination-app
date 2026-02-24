import type { ReactNode } from "react";

import { StudentLayoutShell } from "@/components/student/StudentLayoutShell";

export default function StudentLayout({ children }: { children: ReactNode }) {
  return <StudentLayoutShell>{children}</StudentLayoutShell>;
}
