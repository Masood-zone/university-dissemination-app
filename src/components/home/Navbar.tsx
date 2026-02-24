"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

import { MaterialSymbol } from "@/components/common/MaterialSymbol";
import { ThemeToggle } from "@/components/home/ThemeToggle";
import { UserAvatar } from "@/components/home/UserAvatar";
import { Button } from "@/components/ui/button";
import { useSession } from "@/lib/auth-client";

const navLinks = [
  { label: "Overview", href: "#admissions" },
  { label: "Highlights", href: "#academics" },
  { label: "Modules", href: "#research" },
  { label: "Resources", href: "#e-resources" },
  { label: "About Us", href: "#about-us" },
  { label: "Contact", href: "#contact" },
] as const;

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { data: session } = useSession();
  const isLoggedIn = Boolean(session?.user);

  useEffect(() => {
    if (!mobileOpen) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };

    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [mobileOpen]);

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50 border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Link href="/" className="inline-flex items-center gap-3">
              <Image
                src="/logo.png"
                alt="AAMUSTED Logo"
                width={56}
                height={56}
                className="h-14 w-14 object-contain"
                priority
              />
              <div className="hidden md:block leading-none">
                <p className="text-lg font-extrabold tracking-tight">
                  AAMUSTED
                </p>
                <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  Information Dissemination System
                </p>
              </div>
            </Link>
          </div>

          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((l) => (
              <Link
                key={l.label}
                href={l.href}
                className="text-sm font-semibold text-foreground/80 hover:text-foreground transition-colors"
              >
                {l.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <ThemeToggle />
            {isLoggedIn ? <UserAvatar /> : null}
            {!isLoggedIn && (
              <Link
                href="/login"
                className="hidden sm:inline-flex items-center rounded-md bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground hover:opacity-90"
              >
                Login To Portal
              </Link>
            )}

            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileOpen(true)}
              aria-label="Open navigation menu"
              aria-expanded={mobileOpen}
              aria-controls="mobile-nav"
            >
              <MaterialSymbol icon="menu" className="text-xl" />
            </Button>
          </div>
        </div>
      </header>

      {/* Mobile sidebar */}
      <div
        id="mobile-nav"
        className={
          "md:hidden fixed inset-0 z-100 transition-opacity duration-200 " +
          (mobileOpen
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0")
        }
        aria-hidden={!mobileOpen}
      >
        <button
          type="button"
          className="absolute inset-0 bg-black/60"
          onClick={() => setMobileOpen(false)}
          aria-label="Close navigation menu"
        />

        <aside
          role="dialog"
          aria-modal="true"
          aria-label="Navigation menu"
          className={
            "absolute right-0 top-0 h-full w-[85vw] max-w-sm border-l border-border bg-background shadow-2xl transition-transform duration-300 ease-out will-change-transform " +
            (mobileOpen ? "translate-x-0" : "translate-x-full")
          }
        >
          <div className="flex h-20 items-center justify-between border-b border-border px-4">
            <div className="flex items-center gap-3">
              <Image
                src="/logo.png"
                alt="AAMUSTED Logo"
                width={44}
                height={44}
                className="h-11 w-11 object-contain"
              />
              <div className="leading-none">
                <p className="text-sm font-extrabold tracking-tight">
                  AAMUSTED
                </p>
                <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  SIDS
                </p>
              </div>
            </div>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setMobileOpen(false)}
              aria-label="Close navigation menu"
            >
              <MaterialSymbol icon="close" className="text-xl" />
            </Button>
          </div>

          <div className="h-[calc(100%-5rem)] overflow-y-auto">
            <nav className="px-4 py-6">
              <ul className="space-y-2">
                {navLinks.map((l) => (
                  <li key={l.label}>
                    <Link
                      href={l.href}
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center justify-between rounded-md px-3 py-2.5 text-sm font-semibold text-foreground hover:bg-accent"
                    >
                      {l.label}
                      <span aria-hidden="true">→</span>
                    </Link>
                  </li>
                ))}
              </ul>

              <div className="mt-6">
                {!isLoggedIn && (
                  <Link
                    href="/login"
                    onClick={() => setMobileOpen(false)}
                    className="inline-flex w-full items-center justify-center rounded-md bg-primary px-4 py-3 text-sm font-bold text-primary-foreground hover:opacity-90"
                  >
                    Login To Portal
                  </Link>
                )}
              </div>
            </nav>
          </div>
        </aside>
      </div>
    </>
  );
}
