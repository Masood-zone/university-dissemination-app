"use client";

import AppLayoutShell, {
  type NavSection,
  type NavItem,
} from "@/components/layout/AppLayoutShell";

const defaultAdminNavItems: NavItem[] = [
  { label: "Overview", href: "/administrator", icon: "dashboard" },
  {
    label: "Academic Sessions",
    href: "/administrator/academic-sessions",
    icon: "event_note",
  },
  // {
  //   label: "Student Profiles",
  //   href: "/administrator/student-profiles",
  //   icon: "school",
  // },
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
  {
    label: "Finance & Revenue",
    href: "/administrator/finance",
    icon: "payments",
  },
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
  const topNavItems = defaultAdminNavItems.slice(0, -2);
  const reportNavItems = defaultAdminNavItems.slice(-2);

  const navSections: NavSection[] = [
    { items: topNavItems },
    { label: "Reports", items: reportNavItems },
  ];

  return (
    <AppLayoutShell
      navSections={navSections}
      portalTitle="AAMUSTED IDS"
      portalSubtitle="Admin Portal"
      headerTitle="Admin Dashboard"
      logoSrc="/logo-nobg.png"
      logoAlt="AAMUSTED Logo"
    >
      {children}
    </AppLayoutShell>
  );
}
