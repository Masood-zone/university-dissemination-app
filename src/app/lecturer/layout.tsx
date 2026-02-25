import type { ReactNode } from "react";

import LecturerLayoutShell from "@/components/lecturer/LecturerLayoutShell";

export default function LecturerLayout({ children }: { children: ReactNode }) {
  return <LecturerLayoutShell>{children}</LecturerLayoutShell>;
}
