"use client";

import * as React from "react";

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";

export type BatchRecipient = {
  id: string;
  name: string;
  regNo?: string | null;
};

export function BatchMessageDialog({
  trigger,
  recipients,
  selectedIds,
  onToggle,
  onSelectAll,
  onClear,
  message,
  onMessageChange,
  onSend,
  isSending,
  disabled,
}: {
  trigger: React.ReactNode;
  recipients: BatchRecipient[];
  selectedIds: string[];
  onToggle: (id: string) => void;
  onSelectAll: () => void;
  onClear: () => void;
  message: string;
  onMessageChange: (value: string) => void;
  onSend: () => void;
  isSending?: boolean;
  disabled?: boolean;
}) {
  const selectedCount = selectedIds.length;

  return (
    <Dialog>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Batch message students</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="border rounded-lg">
            <div className="p-3 flex items-center justify-between gap-2 border-b">
              <p className="text-sm font-semibold">Recipients</p>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={onSelectAll}
                  disabled={disabled || recipients.length === 0}
                >
                  Select all
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={onClear}
                  disabled={disabled || selectedCount === 0}
                >
                  Clear
                </Button>
              </div>
            </div>

            <ScrollArea className="h-72">
              <div className="p-2">
                {recipients.length === 0 ? (
                  <p className="text-sm text-muted-foreground p-2">
                    No students available.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {recipients.map((r) => {
                      const checked = selectedIds.includes(r.id);
                      return (
                        <label
                          key={r.id}
                          className="flex items-start gap-3 p-2 rounded-lg hover:bg-accent/40 cursor-pointer"
                        >
                          <Checkbox
                            checked={checked}
                            onCheckedChange={() => onToggle(r.id)}
                            disabled={disabled}
                          />
                          <span className="min-w-0">
                            <span className="text-sm font-medium block truncate">
                              {r.name}
                            </span>
                            {r.regNo ? (
                              <span className="text-xs text-muted-foreground block truncate">
                                {r.regNo}
                              </span>
                            ) : null}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>

          <div className="border rounded-lg flex flex-col">
            <div className="p-3 border-b">
              <p className="text-sm font-semibold">Message</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {selectedCount} selected
              </p>
            </div>
            <div className="p-3 flex-1">
              <Textarea
                value={message}
                onChange={(e) => onMessageChange(e.target.value)}
                placeholder="Write a message to selected students..."
                className="min-h-40"
                disabled={disabled}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            onClick={onSend}
            disabled={
              disabled ||
              isSending ||
              selectedCount === 0 ||
              message.trim().length === 0
            }
          >
            {isSending ? "Sending..." : "Send"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
