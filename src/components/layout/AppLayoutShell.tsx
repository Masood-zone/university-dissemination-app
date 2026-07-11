"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import { MaterialSymbol } from "@/components/common/MaterialSymbol";
import { NotificationBell } from "@/components/common/NotificationBell";
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
  logoAlt = "USTED Logo",
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
      "flex items-center rounded-md border-l-4 border-transparent px-3 py-2.5 text-sm font-semibold transition-[background-color,color,border-color]",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      active
        ? "border-primary bg-accent text-primary"
        : "text-muted-foreground hover:border-border hover:bg-muted/65 hover:text-foreground",
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

      <div className="mx-auto flex w-full max-w-450 border-t-[5px] border-t-neutral-800 dark:border-t-neutral-950">
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-50 flex w-68 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground lg:sticky lg:top-0 lg:h-[calc(100vh-5px)]",
            mobileNavOpen ? "block" : "hidden lg:flex",
          )}
          aria-label="Portal navigation"
        >
          <div className="relative flex flex-col items-center border-t-2 border-brand-gold px-5 py-7">
            <Image
              src={logoSrc}
              alt={logoAlt}
              width={112}
              height={112}
              className="h-24 w-24 object-contain"
              priority
            />
            <h2 className="mt-3 text-center font-display text-sm font-semibold tracking-tight text-sidebar-foreground">
              {portalTitle}
            </h2>
            <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
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
          <header className="sticky top-0 z-10 border-b border-border bg-card/95 px-4 py-4 backdrop-blur sm:px-8 sm:py-5">
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
                <h2 className="font-display text-lg font-semibold text-primary sm:text-xl">
                  {headerTitle}
                </h2>
              </div>

              <div className="flex items-center gap-2">
                <NotificationBell />
              </div>
            </div>
          </header>
          <main className="flex-1 bg-background p-4 sm:p-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
