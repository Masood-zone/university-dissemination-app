"use client";

import * as React from "react";

import { RichMarkdownEditor } from "@/components/common/RichMarkdownEditor";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export function MessageComposer({
  value,
  onChange,
  onSend,
  disabled,
  placeholder,
  rich = false,
}: {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  disabled?: boolean;
  placeholder?: string;
  rich?: boolean;
}) {
  const isEmpty = value.trim().length === 0;
  const isMac =
    typeof navigator !== "undefined" && /Mac/i.test(navigator.userAgent);

  return (
    <div className="border-t bg-background p-3">
      <div className="flex items-end gap-2">
        {rich ? (
          <div className="min-w-0 flex-1">
            <RichMarkdownEditor
              variant="message"
              value={value}
              onChange={onChange}
              onSubmit={onSend}
              disabled={disabled}
              placeholder={placeholder ?? "Type a message..."}
            />
          </div>
        ) : (
          <Textarea
            value={value}
            onChange={(event) => onChange(event.target.value)}
            onKeyDown={(event) => {
              const hotkey = isMac ? event.metaKey : event.ctrlKey;
              if (hotkey && event.key === "Enter") {
                event.preventDefault();
                if (!disabled && !isEmpty) onSend();
              }
            }}
            placeholder={placeholder ?? "Type a message..."}
            className="min-h-11 max-h-40"
            disabled={disabled}
          />
        )}
        <Button type="button" onClick={onSend} disabled={disabled || isEmpty}>
          Send
        </Button>
      </div>
      {!rich ? (
        <p className="mt-2 text-xs text-muted-foreground">
          Markdown supported. {isMac ? "⌘" : "Ctrl"}+Enter to send.
        </p>
      ) : null}
    </div>
  );
}
