"use client";

import type { ReactNode } from "react";

import AppLayoutShell, {
  type NavSection,
} from "@/components/layout/AppLayoutShell";

const studentNavSections: NavSection[] = [
  {
    items: [
      { label: "Dashboard", href: "/student/dashboard", icon: "dashboard" },
      {
        label: "Finance & Fees",
        href: "/student/finance",
        icon: "account_balance_wallet",
      },
      {
        label: "Academic Calendar",
        href: "/student/academic-calendar",
        icon: "calendar_today",
      },
      {
        label: "Course Offerings",
        href: "/student/course-offerings",
        icon: "menu_book",
      },
      {
        label: "Announcements",
        href: "/student/announcements",
        icon: "notifications",
      },
      {
        label: "Messages",
        href: "/student/messaging",
        icon: "message",
      },
      {
        label: "Profile",
        href: "/student/profile",
        icon: "person",
      },
      // { label: "Grades & CGPA", href: "/student/grades", icon: "grade" },
    ],
  },
];

export function StudentLayoutShell({ children }: { children: ReactNode }) {
  return (
    <AppLayoutShell
      navSections={studentNavSections}
      portalTitle="USTED IDS"
      portalSubtitle="Student Portal"
      headerTitle="Student Dashboard"
      logoSrc="/logo-nobg.png"
      logoAlt="USTED Logo"
    >
      {children}
    </AppLayoutShell>
  );
}
