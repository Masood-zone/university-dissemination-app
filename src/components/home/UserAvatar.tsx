"use client";

import Image from "next/image";
import Link from "next/link";

import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

function getInitials(name: string): string {
  const cleaned = name.trim();
  if (!cleaned) return "U";

  const parts = cleaned.split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? "U";
  const last = parts.length > 1 ? parts[parts.length - 1]?.[0] : "";

  return `${first}${last}`.toUpperCase();
}

function avatarSvgDataUri(label: string): string {
  const initials = getInitials(label);

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#0f172a"/>
      <stop offset="1" stop-color="#334155"/>
    </linearGradient>
  </defs>
  <rect width="64" height="64" rx="32" fill="url(#g)"/>
  <text x="32" y="38" text-anchor="middle" font-family="Arial, sans-serif" font-size="22" fill="#ffffff" font-weight="700">${initials}</text>
</svg>`;

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export function UserAvatar({ className }: { className?: string }) {
  const {
    data: session,
    isPending,
    // error,
  } = authClient.useSession();

  if (isPending) {
    return (
      <div
        className={cn(
          "h-9 w-9 rounded-full bg-muted animate-pulse",
          className,
        )}
        aria-label="Loading session"
      />
    );
  }

  const user = (session as unknown as { user?: Record<string, unknown> })?.user;
  const name =
    (typeof user?.name === "string" && user.name) ||
    `${typeof user?.firstName === "string" ? user.firstName : ""} ${
      typeof user?.lastName === "string" ? user.lastName : ""
    }`.trim() ||
    (typeof user?.email === "string" ? user.email : "User");

  const imageSrc =
    (typeof user?.image === "string" && user.image) || avatarSvgDataUri(name);

  if (!session) {
    return (
      <Link
        href="/login"
        className={cn(
          "inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1.5 text-sm font-semibold text-foreground hover:bg-accent",
          className,
        )}
      >
        Portal Login
      </Link>
    );
  }

  return (
    <Link
      href="/dashboard"
      className={cn(
        "inline-flex items-center gap-2 rounded-full border border-border bg-background px-2 py-1.5 hover:bg-accent",
        className,
      )}
      aria-label="Open dashboard"
      title={name}
    >
      <Image
        src={imageSrc}
        alt={name}
        width={28}
        height={28}
        className="h-7 w-7 rounded-full object-cover"
        unoptimized
      />
      <span className="hidden sm:inline text-sm font-semibold max-w-48 truncate">
        {name}
      </span>
    </Link>
  );
}
