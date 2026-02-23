"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode, useEffect, useRef, useState } from "react";

import { MaterialSymbol } from "@/components/common/MaterialSymbol";
import { UserAvatar } from "@/components/home/UserAvatar";
import { cn } from "@/lib/utils";

type NavItem = {
  label: string;
  href: string;
  icon: string;
};

const navItems: NavItem[] = [
  { label: "Overview", href: "/administrator", icon: "dashboard" },
  {
    label: "Academic Sessions",
    href: "/administrator/academic-sessions",
    icon: "event_note",
  },
  {
    label: "Student Profiles",
    href: "/administrator/student-profiles",
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
    label: "Announcements & Communication",
    href: "/administrator/announcements",
    icon: "forum",
  },
  {
    label: "Finance & Revenue",
    href: "/administrator/finance",
    icon: "payments",
  },
  {
    label: "Permissions",
    href: "/administrator/role-based-access",
    icon: "admin_panel_settings",
  },
];

function isActive(pathname: string, href: string): boolean {
  if (href === "/administrator") {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(href + "/");
}

export default function AdminLayoutShell({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const prevPathnameRef = useRef(pathname);

  useEffect(() => {
    if (prevPathnameRef.current !== pathname) {
      prevPathnameRef.current = pathname;
      setMobileNavOpen(false);
    }
  }, [pathname]);

  useEffect(() => {
    if (!mobileNavOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileNavOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [mobileNavOpen]);

  const topNavItems = navItems.slice(0, -2);
  const reportNavItems = navItems.slice(-2);

  const navLinkClass = (active: boolean) =>
    cn(
      "flex items-center rounded-lg border-r-4 border-transparent px-3 py-2.5 text-sm font-medium transition-colors",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      active
        ? "bg-primary/10 text-primary border-primary"
        : "text-muted-foreground hover:bg-accent hover:text-foreground",
    );

  const nav = (
    <nav className="mt-2 px-3 space-y-1">
      {topNavItems.map((item) => {
        const active = isActive(pathname, item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={navLinkClass(active)}
          >
            <MaterialSymbol icon={item.icon} className="mr-3 text-lg" />
            {item.label}
          </Link>
        );
      })}

      <div className="pt-5">
        <p className="px-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
          Reports
        </p>
        {reportNavItems.map((item) => {
          const active = isActive(pathname, item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={navLinkClass(active)}
            >
              <MaterialSymbol icon={item.icon} className="mr-3 text-lg" />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      {mobileNavOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-background/60 backdrop-blur-sm lg:hidden"
          aria-label="Close navigation"
          onClick={() => setMobileNavOpen(false)}
        />
      ) : null}

      <div className="mx-auto flex w-full max-w-400">
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-border bg-background lg:sticky lg:top-0 lg:h-screen",
            mobileNavOpen ? "block" : "hidden lg:flex",
          )}
          aria-label="Administrator navigation"
        >
          <div className="relative flex flex-col items-center px-4 py-4">
            <Image
              src="/logo-nobg.png"
              alt="AAMUSTED Logo"
              width={84}
              height={84}
              className="h-14 w-auto"
              priority
            />
            <h2 className="mt-3 text-xs font-semibold uppercase tracking-wide text-foreground text-center">
              AAMUSTED IDS
            </h2>
            <p className="mt-0.5 text-[10px] font-medium text-muted-foreground uppercase">
              Admin Portal
            </p>

            <button
              type="button"
              className="absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-background hover:bg-accent lg:hidden"
              aria-label="Close navigation"
              onClick={() => setMobileNavOpen(false)}
            >
              <MaterialSymbol icon="close" />
            </button>
          </div>

          <div className="px-4">
            <div className="h-px bg-border" />
          </div>

          <div className="flex-1 overflow-y-auto">{nav}</div>

          <div className="mt-4 border-t border-border p-4">
            <UserAvatar className="w-full justify-between" />
          </div>
        </aside>

        <div className="flex min-h-screen flex-1 flex-col">
          <header className="sticky top-0 z-10 border-b border-border bg-background/90 px-4 py-3 backdrop-blur sm:px-6 sm:py-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-background hover:bg-accent lg:hidden"
                  aria-label="Open navigation"
                  onClick={() => setMobileNavOpen(true)}
                >
                  <MaterialSymbol icon="menu" />
                </button>
                <h2 className="font-lexend text-base font-semibold">
                  Admin Dashboard
                </h2>
              </div>
            </div>
          </header>
          <main className="flex-1 p-6">{children}</main>
        </div>
      </div>
    </div>
  );
}
