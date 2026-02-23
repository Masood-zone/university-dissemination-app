"use client";

import Image from "next/image";
import Link from "next/link";

import { ThemeToggle } from "@/components/home/ThemeToggle";
import { UserAvatar } from "@/components/home/UserAvatar";

const navLinks = [
  { label: "Admissions", href: "#admissions" },
  { label: "Academics", href: "#academics" },
  { label: "Research", href: "#research" },
  { label: "E-Resources", href: "#e-resources" },
  { label: "About Us", href: "#about-us" },
  { label: "Contact", href: "#contact" },
] as const;

export function Navbar() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
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
              <p className="text-lg font-extrabold tracking-tight">AAMUSTED</p>
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

        <div className="flex items-center gap-3">
          <ThemeToggle />
          <UserAvatar />
          <Link
            href="#admissions"
            className="hidden sm:inline-flex items-center rounded-md bg-destructive px-5 py-2.5 text-sm font-bold text-destructive-foreground hover:opacity-90"
          >
            Enroll Now
          </Link>
        </div>
      </div>
    </header>
  );
}
