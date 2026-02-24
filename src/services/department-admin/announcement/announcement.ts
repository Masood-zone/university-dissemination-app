import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import api from "@/lib/axios";
import { toApiClientError } from "@/lib/api-client-error";
import type {
  AdminAnnouncementDetail,
  AdminAnnouncementsListResult,
  ApiResponse,
  UpsertAnnouncementInput,
} from "@/types";

export type DepartmentAdminAnnouncementsListParams = {
  q?: string;
  status?: string;
  page?: number;
  pageSize?: number;
};

const announcementKeys = {
  all: ["department-admin", "announcements"] as const,
  list: (params: DepartmentAdminAnnouncementsListParams) =>
    ["department-admin", "announcements", "list", params] as const,
  detail: (id: string) =>
    ["department-admin", "announcements", "detail", id] as const,
};

async function getAnnouncements(
  params: DepartmentAdminAnnouncementsListParams,
): Promise<AdminAnnouncementsListResult> {
  try {
    const res = await api.get<ApiResponse<AdminAnnouncementsListResult>>(
      "/department-admin/announcements",
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

async function getAnnouncementDetail(
  id: string,
): Promise<AdminAnnouncementDetail> {
  try {
    const res = await api.get<ApiResponse<AdminAnnouncementDetail>>(
      `/department-admin/announcements/${id}`,
    );

    if (!res.data.success || !res.data.data) {
      throw new Error(res.data.message || "Failed to load announcement");
    }

    return res.data.data;
  } catch (error) {
    throw toApiClientError(error, "Failed to load announcement");
  }
}

async function createAnnouncement(
  input: UpsertAnnouncementInput,
): Promise<{ id: string }> {
  try {
    const res = await api.post<ApiResponse<{ id: string }>>(
      "/department-admin/announcements",
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

async function updateAnnouncement(args: {
  id: string;
  input: UpsertAnnouncementInput;
}): Promise<void> {
  try {
    const res = await api.patch<ApiResponse<{ ok: true }>>(
      `/department-admin/announcements/${args.id}`,
      args.input,
    );

    if (!res.data.success) {
      throw new Error(res.data.message || "Failed to update announcement");
    }
  } catch (error) {
    throw toApiClientError(error, "Failed to update announcement");
  }
}

async function deleteAnnouncement(id: string): Promise<void> {
  try {
    const res = await api.delete<ApiResponse<{ ok: true }>>(
      `/department-admin/announcements/${id}`,
    );

    if (!res.data.success) {
      throw new Error(res.data.message || "Failed to delete announcement");
    }
  } catch (error) {
    throw toApiClientError(error, "Failed to delete announcement");
  }
}

export type UploadImageResult = {
  id: string;
  url: string;
  secureUrl?: string;
  publicId: string;
};

async function uploadAnnouncementImage(file: File): Promise<UploadImageResult> {
  try {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", "announcements");

    const res = await api.post<ApiResponse<UploadImageResult>>(
      "/uploads/images",
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
      },
    );

    if (!res.data.success || !res.data.data) {
      throw new Error(res.data.message || "Failed to upload image");
    }

    return res.data.data;
  } catch (error) {
    throw toApiClientError(error, "Failed to upload image");
  }
}

export function useDepartmentAdminAnnouncementsList(
  params: DepartmentAdminAnnouncementsListParams,
) {
  return useQuery({
    queryKey: announcementKeys.list(params),
    queryFn: () => getAnnouncements(params),
    staleTime: 15 * 1000,
  });
}

export function useDepartmentAdminAnnouncementDetail(id: string | null) {
  return useQuery({
    queryKey: id
      ? announcementKeys.detail(id)
      : ["department-admin", "announcements", "detail", null],
    queryFn: () => {
      if (!id) throw new Error("Missing announcement id");
      return getAnnouncementDetail(id);
    },
    enabled: Boolean(id),
    staleTime: 15 * 1000,
  });
}

export function useDepartmentAdminCreateAnnouncement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createAnnouncement,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: announcementKeys.all });
    },
  });
}

export function useDepartmentAdminUpdateAnnouncement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateAnnouncement,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: announcementKeys.all });
    },
  });
}

export function useDepartmentAdminDeleteAnnouncement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteAnnouncement,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: announcementKeys.all });
    },
  });
}

export function useDepartmentAdminUploadAnnouncementImage() {
  return useMutation({
    mutationFn: uploadAnnouncementImage,
  });
}

export { announcementKeys };
