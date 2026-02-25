"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
import { MessageMarkdownPreview } from "@/components/messaging/MessageMarkdown";

export function MessageBubble({
  content,
  time,
  isOwn,
}: {
  content: string;
  time: string;
  isOwn: boolean;
}) {
  return (
    <div className={cn("flex", isOwn ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
          isOwn
            ? "bg-primary text-primary-foreground"
            : "bg-background border border-border",
        )}
      >
        <MessageMarkdownPreview
          source={content}
          colorMode={isOwn ? "dark" : "light"}
        />
        <p
          className={cn(
            "mt-2 text-[10px]",
            isOwn ? "text-primary-foreground/70" : "text-muted-foreground",
          )}
        >
          {time}
        </p>
      </div>
    </div>
  );
}
