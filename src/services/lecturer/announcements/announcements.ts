import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import api from "@/lib/axios";
import { toApiClientError } from "@/lib/api-client-error";
import type { ApiResponse } from "@/types";

import type {
  CreateLecturerAnnouncementInput,
  LecturerAnnouncementsResponse,
} from "@/app/api/lecturer/announcements/route";

const announcementKeys = {
  all: ["lecturer", "announcements"] as const,
};

async function getLecturerAnnouncements(): Promise<LecturerAnnouncementsResponse> {
  try {
    const res = await api.get<ApiResponse<LecturerAnnouncementsResponse>>(
      "/lecturer/announcements",
    );

    if (!res.data.success || !res.data.data) {
      throw new Error(res.data.message || "Failed to load announcements");
    }

    return res.data.data;
  } catch (error) {
    throw toApiClientError(error, "Failed to load announcements");
  }
}

async function createLecturerAnnouncement(
  input: CreateLecturerAnnouncementInput,
): Promise<{ id: string }> {
  try {
    const res = await api.post<ApiResponse<{ id: string }>>(
      "/lecturer/announcements",
      input,
    );

    if (!res.data.success || !res.data.data) {
      throw new Error(res.data.message || "Failed to create announcement");
    }

    return res.data.data;
  } catch (error) {
    throw toApiClientError(error, "Failed to create announcement");
  }
}

export function useLecturerAnnouncements() {
  return useQuery({
    queryKey: announcementKeys.all,
    queryFn: getLecturerAnnouncements,
    staleTime: 15 * 1000,
  });
}

export function useCreateLecturerAnnouncement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createLecturerAnnouncement,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: announcementKeys.all });
    },
  });
}

export { announcementKeys };
