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
  list: (params: { q?: string; status?: string }) =>
    ["lecturer", "announcements", params] as const,
};

async function getLecturerAnnouncements(params: {
  q?: string;
  status?: string;
}): Promise<LecturerAnnouncementsResponse> {
  try {
    const res = await api.get<ApiResponse<LecturerAnnouncementsResponse>>(
      "/lecturer/announcements",
      { params },
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

export function useLecturerAnnouncements(params: {
  q?: string;
  status?: string;
} = {}) {
  return useQuery({
    queryKey: announcementKeys.list(params),
    queryFn: () => getLecturerAnnouncements(params),
    staleTime: 15 * 1000,
  });
}

export function useUpdateLecturerAnnouncement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      input,
    }: {
      id: string;
      input: CreateLecturerAnnouncementInput;
    }) => {
      const response = await api.patch<ApiResponse<{ id: string }>>(
        `/lecturer/announcements/${id}`,
        input,
      );
      if (!response.data.success) {
        throw new Error(response.data.message || "Failed to update announcement");
      }
      return response.data.data;
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: announcementKeys.all }),
  });
}

export function useArchiveLecturerAnnouncement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete<ApiResponse<{ id: string }>>(
        `/lecturer/announcements/${id}`,
      );
      if (!response.data.success) {
        throw new Error(response.data.message || "Failed to archive announcement");
      }
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: announcementKeys.all }),
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
