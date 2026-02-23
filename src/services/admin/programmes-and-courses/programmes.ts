import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import api from "@/lib/axios";
import { toApiClientError } from "@/lib/api-client-error";
import type {
  ApiResponse,
  CourseData,
  CreateProgrammeCourseInput,
  CreateProgrammeInput,
  ProgrammeDetailsResponse,
  ProgrammeListItem,
} from "@/types";

const programmeKeys = {
  list: ["programmes", "list"] as const,
  details: (id: string) => ["programmes", "details", id] as const,
};

async function getProgrammes(): Promise<ProgrammeListItem[]> {
  try {
    const response = await api.get<ApiResponse<ProgrammeListItem[]>>(
      "/administrator/departments/programmes-and-courses",
    );

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || "Failed to load programmes");
    }

    return response.data.data;
  } catch (error) {
    throw toApiClientError(error, "Failed to load programmes");
  }
}

async function getProgrammeDetails(
  id: string,
): Promise<ProgrammeDetailsResponse> {
  try {
    const response = await api.get<ApiResponse<ProgrammeDetailsResponse>>(
      `/administrator/departments/programmes-and-courses/${id}`,
    );

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || "Failed to load programme");
    }

    return response.data.data;
  } catch (error) {
    throw toApiClientError(error, "Failed to load programme");
  }
}

async function createProgramme(
  input: CreateProgrammeInput,
): Promise<ProgrammeListItem> {
  try {
    const response = await api.post<ApiResponse<ProgrammeListItem>>(
      "/administrator/departments/programmes-and-courses/add-programme",
      input,
    );

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || "Failed to create programme");
    }

    return response.data.data;
  } catch (error) {
    throw toApiClientError(error, "Failed to create programme");
  }
}

async function createProgrammeCourse(
  input: CreateProgrammeCourseInput,
): Promise<CourseData> {
  try {
    const response = await api.post<ApiResponse<CourseData>>(
      "/administrator/departments/programmes-and-courses/add-courses",
      {
        programmeId: input.programmeId,
        title: input.title,
        code: input.code,
        credits: input.credits,
        description: input.description,
        semester: input.semester,
        prerequisites: input.prerequisites,
      },
    );

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || "Failed to create course");
    }

    return response.data.data;
  } catch (error) {
    throw toApiClientError(error, "Failed to create course");
  }
}

async function deleteProgramme(id: string): Promise<{ id: string }> {
  try {
    const response = await api.delete<ApiResponse<{ id: string }>>(
      `/administrator/departments/programmes-and-courses/${id}`,
    );

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || "Failed to delete programme");
    }

    return response.data.data;
  } catch (error) {
    throw toApiClientError(error, "Failed to delete programme");
  }
}

export function useGetProgrammes() {
  return useQuery({
    queryKey: programmeKeys.list,
    queryFn: getProgrammes,
    staleTime: 60 * 1000,
  });
}

export function useGetProgrammeDetails(id: string | null) {
  return useQuery({
    queryKey: id ? programmeKeys.details(id) : ["programmes", "details", null],
    queryFn: () => {
      if (!id) throw new Error("Missing programme id");
      return getProgrammeDetails(id);
    },
    enabled: Boolean(id),
    staleTime: 60 * 1000,
  });
}

export function useCreateProgramme() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createProgramme,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: programmeKeys.list });
    },
  });
}

export function useCreateProgrammeCourse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createProgrammeCourse,
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({ queryKey: programmeKeys.list });
      await queryClient.invalidateQueries({
        queryKey: programmeKeys.details(variables.programmeId),
      });
    },
  });
}

export function useDeleteProgramme() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteProgramme,
    onSuccess: async (_, programmeId) => {
      await queryClient.invalidateQueries({ queryKey: programmeKeys.list });
      await queryClient.invalidateQueries({
        queryKey: programmeKeys.details(programmeId),
      });
    },
  });
}
