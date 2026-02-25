"use client";

import type { ReactNode } from "react";

import AppLayoutShell, {
  type NavItem,
  type NavSection,
} from "@/components/layout/AppLayoutShell";

const defaultLecturerNavItems: NavItem[] = [
  { label: "Overview", href: "/lecturer", icon: "dashboard" },
  { label: "My Courses", href: "/lecturer/courses", icon: "menu_book" },
  {
    label: "Announcements",
    href: "/lecturer/announcements",
    icon: "campaign",
  },
  { label: "Profile", href: "/lecturer/profile", icon: "person" },
];

export default function LecturerLayoutShell({
  children,
}: {
  children: ReactNode;
}) {
  const navSections: NavSection[] = [{ items: defaultLecturerNavItems }];

  return (
    <AppLayoutShell
      navSections={navSections}
      portalTitle="AAMUSTED IDS"
      portalSubtitle="Lecturer Portal"
      headerTitle="Lecturer Dashboard"
      logoSrc="/logo-nobg.png"
      logoAlt="AAMUSTED Logo"
    >
      {children}
    </AppLayoutShell>
  );
}
