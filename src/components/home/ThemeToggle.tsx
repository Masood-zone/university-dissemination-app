"use client";

import { useTheme } from "next-themes";

import { MaterialSymbol } from "@/components/common/MaterialSymbol";
import { cn } from "@/lib/utils";

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme, resolvedTheme } = useTheme();

  const current = theme === "system" ? resolvedTheme : theme;
  const isDark = current === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={cn(
        "inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-background hover:bg-accent",
        className,
      )}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      <MaterialSymbol icon={isDark ? "light_mode" : "dark_mode"} />
    </button>
  );
}
