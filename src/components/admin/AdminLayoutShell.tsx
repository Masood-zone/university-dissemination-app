"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";

type NavItem = {
  label: string;
  href: string;
};

const navItems: NavItem[] = [
  { label: "Overview", href: "/administrator/dashboard" },
  { label: "Academic Sessions", href: "/administrator/academic-sessions" },
  {
    label: "Student Applications",
    href: "/administrator/student-applications",
  },
  { label: "Student Profiles", href: "/administrator/student-profiles" },
  {
    label: "Department Management",
    href: "/administrator/department-management",
  },
  { label: "Create Department", href: "/administrator/create-department" },
  { label: "Add Programmes", href: "/administrator/add-programmes" },
  { label: "Add Course", href: "/administrator/add-course" },
  { label: "Staff Directory", href: "/administrator/faculty-staff-directory" },
  { label: "New Staff Member", href: "/administrator/new-staff-member" },
  { label: "Role-Based Access", href: "/administrator/role-based-access" },
  { label: "Finance", href: "/administrator/finance" },
  { label: "Announcements", href: "/administrator/announcements" },
];

function isActive(pathname: string, href: string): boolean {
  if (href === "/administrator/dashboard") {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function AdminLayoutShell({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex w-full max-w-400">
        <aside className="sticky top-0 h-screen w-72 border-r border-border bg-card/70 px-4 py-6">
          <div className="mb-6 px-2">
            <h1 className="font-lexend text-lg font-semibold">Administrator</h1>
            <p className="text-sm text-muted-foreground">Dashboard workspace</p>
          </div>

          <nav className="space-y-1">
            {navItems.map((item) => {
              const active = isActive(pathname, item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`block rounded-md px-3 py-2 text-sm transition-colors ${
                    active
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        <div className="flex min-h-screen flex-1 flex-col">
          <header className="sticky top-0 z-10 border-b border-border bg-background/90 px-6 py-4 backdrop-blur">
            <h2 className="font-lexend text-base font-semibold">
              Admin Dashboard
            </h2>
          </header>
          <main className="flex-1 p-6">{children}</main>
        </div>
      </div>
    </div>
  );
}
