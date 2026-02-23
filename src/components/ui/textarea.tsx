import * as React from "react";

import { cn } from "@/lib/utils";

export type TextareaProps = React.ComponentProps<"textarea">;

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={cn(
          "border-input bg-transparent dark:bg-input/30 w-full rounded-md border px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none",
          "placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className,
        )}
        {...props}
      />
    );
  },
);

Textarea.displayName = "Textarea";
