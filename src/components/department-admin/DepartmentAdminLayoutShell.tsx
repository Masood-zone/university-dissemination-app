"use client";

import AppLayoutShell, {
  type NavItem,
  type NavSection,
} from "@/components/layout/AppLayoutShell";

const defaultDepartmentAdminNavItems: NavItem[] = [
  { label: "Overview", href: "/department-admin", icon: "dashboard" },
  {
    label: "Staff Management",
    href: "/department-admin/staff-management",
    icon: "groups",
  },
  {
    label: "Programmes & Courses",
    href: "/department-admin/programmes-and-courses",
    icon: "menu_book",
  },
  {
    label: "Announcements",
    href: "/department-admin/announcements",
    icon: "campaign",
  },
  {
    label: "Profile",
    href: "/profile",
    icon: "person",
  },
  {
    label: "Analytics",
    href: "/department-admin/analytics",
    icon: "analytics",
  },
];

export type { NavSection };

export default function DepartmentAdminLayoutShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const topNavItems = defaultDepartmentAdminNavItems.slice(0, -1);
  const reportNavItems = defaultDepartmentAdminNavItems.slice(-1);

  const navSections: NavSection[] = [
    { items: topNavItems },
    { label: "Reports", items: reportNavItems },
  ];

  return (
    <AppLayoutShell
      navSections={navSections}
      portalTitle="AAMUSTED IDS"
      portalSubtitle="Dept. Head Portal"
      headerTitle="Department Admin Dashboard"
      logoSrc="/logo-nobg.png"
      logoAlt="AAMUSTED Logo"
    >
      {children}
    </AppLayoutShell>
  );
}
