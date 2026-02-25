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

  return (
    <div className="border-t bg-background p-3">
      <div className="flex gap-2 items-end">
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder ?? "Type a message..."}
          className="min-h-[44px] max-h-40"
          disabled={disabled}
        />
        <Button
          type="button"
          onClick={onSend}
          disabled={disabled || isEmpty}
        >
          Send
        </Button>
      </div>
    </div>
  );
}
