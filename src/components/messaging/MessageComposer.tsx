"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export function MessageComposer({
  value,
  onChange,
  onSend,
  disabled,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  disabled?: boolean;
  placeholder?: string;
}) {
  const isEmpty = value.trim().length === 0;
  const isMac =
    typeof navigator !== "undefined" && /Mac/i.test(navigator.userAgent);

  return (
    <div className="border-t bg-background p-3">
      <div className="flex gap-2 items-end">
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            const hotkey = isMac ? e.metaKey : e.ctrlKey;
            if (hotkey && e.key === "Enter") {
              e.preventDefault();
              if (!disabled && !isEmpty) onSend();
            }
          }}
          placeholder={placeholder ?? "Type a message..."}
          className="min-h-11 max-h-40"
          disabled={disabled}
        />
        <Button type="button" onClick={onSend} disabled={disabled || isEmpty}>
          Send
        </Button>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        Markdown supported. {isMac ? "⌘" : "Ctrl"}+Enter to send.
      </p>
    </div>
  );
}
