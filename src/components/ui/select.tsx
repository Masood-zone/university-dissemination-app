import * as React from "react";

import { cn } from "@/lib/utils";

export type SelectProps = React.ComponentProps<"select">;

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <select
        ref={ref}
        className={cn(
          "border-input bg-transparent dark:bg-input/30 h-9 w-full rounded-md border px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none",
          "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className,
        )}
        {...props}
      >
        {children}
      </select>
    );
  },
);

Select.displayName = "Select";
