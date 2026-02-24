"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import { MaterialSymbol } from "@/components/common/MaterialSymbol";
import { UserAvatar } from "@/components/home/UserAvatar";
import { cn } from "@/lib/utils";

export type NavItem = {
  label: string;
  href: string;
  icon: string;
};

export type NavSection = {
  label?: string;
  items: NavItem[];
};

function isActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(href + "/");
}

export default function AppLayoutShell({
  children,
  navSections,
  portalTitle,
  portalSubtitle,
  headerTitle,
  logoSrc = "/logo-nobg.png",
  logoAlt = "AAMUSTED Logo",
}: {
  children: React.ReactNode;
  navSections: NavSection[];
  portalTitle: string;
  portalSubtitle: string;
  headerTitle: string;
  logoSrc?: string;
  logoAlt?: string;
}) {
  const pathname = usePathname();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const prevPathnameRef = useRef(pathname);

  useEffect(() => {
    if (prevPathnameRef.current === pathname) return;
    prevPathnameRef.current = pathname;
    if (!mobileNavOpen) return;

    Promise.resolve().then(() => setMobileNavOpen(false));
  }, [pathname, mobileNavOpen]);

  useEffect(() => {
    if (!mobileNavOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileNavOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [mobileNavOpen]);

  const computedSections = useMemo(() => navSections ?? [], [navSections]);

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
      {computedSections.map((section, sectionIdx) => (
        <div
          key={section.label ?? sectionIdx}
          className={sectionIdx ? "pt-5" : ""}
        >
          {section.label ? (
            <p className="px-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              {section.label}
            </p>
          ) : null}
          {section.items.map((item) => {
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
      ))}
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
          aria-label="Portal navigation"
        >
          <div className="relative flex flex-col items-center px-4 py-4">
            <Image
              src={logoSrc}
              alt={logoAlt}
              width={84}
              height={84}
              className="h-14 w-auto"
              priority
            />
            <h2 className="mt-3 text-xs font-semibold uppercase tracking-wide text-foreground text-center">
              {portalTitle}
            </h2>
            <p className="mt-0.5 text-[10px] font-medium text-muted-foreground uppercase">
              {portalSubtitle}
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
                  {headerTitle}
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
