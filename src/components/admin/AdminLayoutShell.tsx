"use client";

import AppLayoutShell, {
  type NavSection,
  type NavItem,
} from "@/components/layout/AppLayoutShell";

const mainAdminNavItems: NavItem[] = [
  { label: "Overview", href: "/administrator", icon: "dashboard" },
  {
    label: "Academic Sessions",
    href: "/administrator/academic-sessions",
    icon: "event_note",
  },
  {
    label: "Students",
    href: "/administrator/student-profiles",
    icon: "groups",
  },
  {
    label: "Student Applications",
    href: "/administrator/student-applications",
    icon: "school",
  },
  {
    label: "Programmes & Courses",
    href: "/administrator/programmes-and-courses",
    icon: "menu_book",
  },
  {
    label: "Departments",
    href: "/administrator/department-management",
    icon: "business",
  },
  {
    label: "Announcements",
    href: "/administrator/announcements",
    icon: "forum",
  },
];

const accountNavItems: NavItem[] = [
  {
    label: "Profile",
    href: "/administrator/profile",
    icon: "person",
  },
];

export type { NavSection };

export default function AdminLayoutShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const navSections: NavSection[] = [
    { items: mainAdminNavItems },
    { label: "Account", items: accountNavItems },
  ];

  return (
    <AppLayoutShell
      navSections={navSections}
      portalTitle="USTED IDS"
      portalSubtitle="Admin Portal"
      headerTitle="Admin Dashboard"
      logoSrc="/logo-nobg.png"
      logoAlt="USTED Logo"
    >
      {children}
    </AppLayoutShell>
  );
}
