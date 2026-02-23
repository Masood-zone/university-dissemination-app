"use client";

import { useEffect, useState } from "react";

import { MaterialSymbol } from "@/components/common/MaterialSymbol";
import { cn } from "@/lib/utils";

export function ScrollToTop() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setIsVisible(window.scrollY > 400);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className={cn(
        "fixed bottom-8 right-8 z-50 inline-flex h-11 w-11 items-center justify-center rounded-full border border-border bg-background shadow-lg transition-all",
        "hover:bg-accent",
        !isVisible && "pointer-events-none opacity-0 translate-y-1",
      )}
      aria-label="Scroll to top"
    >
      <MaterialSymbol icon="arrow_upward" />
    </button>
  );
}
