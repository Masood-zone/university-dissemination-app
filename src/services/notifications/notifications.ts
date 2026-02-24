import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import api from "@/lib/axios";
import { toApiClientError } from "@/lib/api-client-error";
import type { ApiResponse, Notification } from "@/types";

export type NotificationsListResult = {
  notifications: Notification[];
  unreadCount: number;
};

export type NotificationsListParams = {
  limit?: number;
};

const notificationKeys = {
  all: ["notifications"] as const,
  list: (params: NotificationsListParams) =>
    ["notifications", "list", params.limit ?? 10] as const,
};

function normalizeNotification(
  n: Omit<Notification, "createdAt"> & { createdAt: string | Date },
): Notification {
  return {
    ...n,
    createdAt:
      n.createdAt instanceof Date ? n.createdAt : new Date(n.createdAt),
  };
}

async function getNotifications(
  params: NotificationsListParams,
): Promise<NotificationsListResult> {
  try {
    const res = await api.get<
      ApiResponse<{
        notifications: Array<
          Omit<Notification, "createdAt"> & { createdAt: string | Date }
        >;
        unreadCount: number;
      }>
    >("/notifications", { params: { limit: params.limit ?? 10 } });

    if (!res.data.success || !res.data.data) {
      throw new Error(res.data.message || "Failed to load notifications");
    }

    return {
      notifications: res.data.data.notifications.map(normalizeNotification),
      unreadCount: res.data.data.unreadCount,
    };
  } catch (error) {
    throw toApiClientError(error, "Failed to load notifications");
  }
}

async function markNotificationRead(notificationId: string): Promise<void> {
  try {
    const res = await api.put<ApiResponse<{ ok: true }>>("/notifications", {
      notificationId,
      read: true,
    });

    if (!res.data.success) {
      throw new Error(res.data.message || "Failed to update notification");
    }
  } catch (error) {
    throw toApiClientError(error, "Failed to update notification");
  }
}

async function markAllNotificationsRead(): Promise<void> {
  try {
    const res = await api.put<ApiResponse<{ ok: true }>>("/notifications", {
      markAll: true,
    });

    if (!res.data.success) {
      throw new Error(res.data.message || "Failed to update notifications");
    }
  } catch (error) {
    throw toApiClientError(error, "Failed to update notifications");
  }
}

async function deleteNotification(notificationId: string): Promise<void> {
  try {
    const res = await api.delete<ApiResponse<{ ok: true }>>("/notifications", {
      params: { id: notificationId },
    });

    if (!res.data.success) {
      throw new Error(res.data.message || "Failed to delete notification");
    }
  } catch (error) {
    throw toApiClientError(error, "Failed to delete notification");
  }
}

export function useNotificationsList(
  params: NotificationsListParams,
  enabled: boolean = true,
) {
  return useQuery({
    queryKey: notificationKeys.list(params),
    queryFn: () => getNotifications(params),
    enabled,
    staleTime: 10 * 1000,
    refetchInterval: 30 * 1000,
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: markNotificationRead,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}

export function useDeleteNotification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteNotification,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}

export { notificationKeys };
