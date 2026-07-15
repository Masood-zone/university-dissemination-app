"use client";

import Image from "next/image";
import Link from "next/link";

import { UserAvatar } from "@/components/home/UserAvatar";

export function Footer() {
  return (
    <footer
      id="contact"
      className="scroll-mt-24 border-t-2 border-brand-gold bg-brand-burgundy py-16 text-white"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-10 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-md">
            <div className="flex items-center gap-3">
              <Image
                src="/logo.png"
                alt="USTED Logo"
                width={64}
                height={64}
                className="h-16 w-16 object-contain"
              />
              <div className="leading-none">
                <p className="font-display text-lg font-extrabold">USTED</p>
                <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-white/70">
                  Information Dissemination System
                </p>
              </div>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-white/75">
              A centralized communication platform for timely announcements,
              academic information, administrative services, campus life
              updates, and direct student-staff messaging — with role-based
              access and user preference customization.
            </p>
          </div>

          <div className="grid gap-8 sm:grid-cols-2">
            <div id="e-resources" className="scroll-mt-24">
              <p className="text-sm font-bold">Quick Links</p>
              <ul className="mt-4 space-y-3 text-sm text-white/75">
                <li>
                  <Link className="hover:underline" href="#usted">
                    Explore USTED
                  </Link>
                </li>
                <li>
                  <Link className="hover:underline" href="#academics">
                    Notifications & Dashboards
                  </Link>
                </li>
                <li>
                  <Link className="hover:underline" href="#e-resources">
                    Resources
                  </Link>
                </li>
                <li>
                  <Link className="hover:underline" href="/login">
                    Sign In
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <p className="text-sm font-bold">Session</p>
              <div className="mt-4">
                <UserAvatar />
              </div>
              <p className="mt-3 text-xs text-white/70">
                Signed-in users see their avatar here.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/20 pt-8 text-xs text-white/70 md:flex-row">
          <p>© 2026 USTED Information Dissemination System.</p>
          <div className="flex items-center gap-6">
            <Link className="hover:underline" href="#">
              Privacy Policy
            </Link>
            <Link className="hover:underline" href="#">
              Terms of Service
            </Link>
            <Link className="hover:underline" href="#">
              Cookie Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
