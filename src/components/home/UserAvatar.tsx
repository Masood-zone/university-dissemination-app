"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { authClient } from "@/lib/auth-client";
import { cn, getInitials } from "@/lib/utils";
import { MaterialSymbol } from "@/components/common/MaterialSymbol";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { userLogout } from "@/services/auth/user-auth";
import { useRouteToDashboard } from "@/hooks/useRouteToDashboard";

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
  const router = useRouter();
  const {
    data: session,
    isPending,
    // error,
  } = authClient.useSession();
  const routeToDashboard = useRouteToDashboard();
  if (isPending) {
    return (
      <div
        className={cn("h-9 w-9 rounded-full bg-muted animate-pulse", className)}
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

  const onLogout = async () => {
    await userLogout();
    router.refresh();
    router.push("/");
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex items-center gap-2 rounded-full border border-border bg-background px-2 py-1.5 hover:bg-accent",
            className,
          )}
          aria-label="Open user menu"
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
          <MaterialSymbol
            icon="expand_more"
            className="hidden sm:inline text-[18px] text-muted-foreground"
          />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="space-y-0.5">
          <div className="text-sm font-semibold truncate">{name}</div>
          {typeof user?.email === "string" ? (
            <div className="text-xs font-normal text-muted-foreground truncate">
              {user.email}
            </div>
          ) : null}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        <DropdownMenuItem asChild className="cursor-pointer">
          <span onClick={() => routeToDashboard(user?.role as string)}>
            <MaterialSymbol icon="dashboard" className="text-[18px]" />
            Dashboard
          </span>
        </DropdownMenuItem>
        <DropdownMenuItem asChild className="cursor-pointer">
          <Link href="/profile">
            <MaterialSymbol icon="person" className="text-[18px]" />
            Profile
          </Link>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          variant="destructive"
          className="cursor-pointer"
          onSelect={(e) => {
            e.preventDefault();
            void onLogout();
          }}
        >
          <MaterialSymbol icon="logout" className="text-[18px]" />
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
