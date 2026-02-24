"use client";

import * as React from "react";
import { toast } from "sonner";

import { MaterialSymbol } from "@/components/common/MaterialSymbol";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn, timeAgo } from "@/lib/utils";
import {
  useDeleteNotification,
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotificationsList,
} from "@/services/notifications/notifications";

export function NotificationBell() {
  const listQuery = useNotificationsList({ limit: 10 }, true);
  const markReadMutation = useMarkNotificationRead();
  const deleteMutation = useDeleteNotification();
  const markAllMutation = useMarkAllNotificationsRead();

  const unreadCount = listQuery.data?.unreadCount ?? 0;
  const notifications = listQuery.data?.notifications ?? [];

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="relative"
          aria-label="Open notifications"
        >
          <MaterialSymbol icon="notifications" className="text-[20px]" />
          {unreadCount > 0 ? (
            <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          ) : null}
        </Button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-96 max-w-[calc(100vw-2rem)] p-0">
        <PopoverHeader className="flex flex-row items-center justify-between gap-3 border-b border-border p-4">
          <div className="min-w-0">
            <PopoverTitle className="text-sm font-semibold">
              Notifications
            </PopoverTitle>
            <p className="text-xs text-muted-foreground">
              {unreadCount ? `${unreadCount} unread` : "All caught up"}
            </p>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={
              unreadCount === 0 ||
              markAllMutation.isPending ||
              listQuery.isPending
            }
            onClick={() =>
              markAllMutation.mutate(undefined, {
                onError: () => toast.error("Failed to mark all as read"),
              })
            }
          >
            Mark all read
          </Button>
        </PopoverHeader>

        <div className="max-h-96 overflow-y-auto p-2">
          {listQuery.isPending ? (
            <div className="rounded-lg p-6 text-center text-sm text-muted-foreground">
              Loading...
            </div>
          ) : listQuery.isError ? (
            <div className="rounded-lg p-6 text-center text-sm text-muted-foreground">
              Failed to load notifications.
            </div>
          ) : notifications.length === 0 ? (
            <div className="rounded-lg p-6 text-center text-sm text-muted-foreground">
              No notifications.
            </div>
          ) : (
            <div className="space-y-2">
              {notifications.map((n) => (
                <div
                  key={n.id}
                  className={cn(
                    "group flex items-start gap-3 rounded-xl border border-border bg-background p-3 transition-colors hover:bg-accent/30",
                    !n.isRead ? "border-primary/30 bg-primary/5" : null,
                  )}
                >
                  <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border bg-card">
                    <MaterialSymbol
                      icon={n.isRead ? "notifications" : "notifications_unread"}
                      className="text-[18px] text-muted-foreground"
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p
                        className={cn(
                          "truncate text-sm",
                          n.isRead ? "font-medium" : "font-semibold",
                        )}
                      >
                        {n.title}
                      </p>

                      <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                        {!n.isRead ? (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            aria-label="Mark notification as read"
                            disabled={markReadMutation.isPending}
                            onClick={() =>
                              markReadMutation.mutate(n.id, {
                                onError: () =>
                                  toast.error("Failed to mark as read"),
                              })
                            }
                          >
                            <MaterialSymbol
                              icon="done"
                              className="text-[18px]"
                            />
                          </Button>
                        ) : null}

                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          aria-label="Delete notification"
                          disabled={deleteMutation.isPending}
                          onClick={() =>
                            deleteMutation.mutate(n.id, {
                              onError: () =>
                                toast.error("Failed to delete notification"),
                            })
                          }
                        >
                          <MaterialSymbol
                            icon="delete"
                            className="text-[18px]"
                          />
                        </Button>
                      </div>
                    </div>

                    <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                      {n.message}
                    </p>

                    <p className="mt-2 text-[11px] text-muted-foreground">
                      {timeAgo(n.createdAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
