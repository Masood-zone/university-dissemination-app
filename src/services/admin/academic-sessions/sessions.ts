import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import api from "@/lib/axios";
import { toApiClientError } from "@/lib/api-client-error";
import type {
  AcademicSessionSemester,
  AcademicSessionSummary,
  AcademicSessionsOverviewResponse,
  ApiResponse,
  CreateAcademicSessionInput,
  DeleteAcademicSessionInput,
  SetCurrentSemesterInput,
  UpdateAcademicSessionInput,
  UpsertSessionSemesterInput,
} from "@/types";

const sessionsKeys = {
  overview: ["academic-sessions", "overview"] as const,
};

async function getSessions(): Promise<AcademicSessionsOverviewResponse> {
  try {
    const response = await api.get<
      ApiResponse<AcademicSessionsOverviewResponse>
    >("/administrator/academic-sessions/get-sessions");

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || "Failed to load sessions");
    }

    return response.data.data;
  } catch (error) {
    throw toApiClientError(error, "Failed to load sessions");
  }
}

async function createSession(
  input: CreateAcademicSessionInput,
): Promise<AcademicSessionSummary> {
  try {
    const response = await api.post<ApiResponse<AcademicSessionSummary>>(
      "/administrator/academic-sessions/create-session",
      input,
    );

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || "Failed to create session");
    }

    return response.data.data;
  } catch (error) {
    throw toApiClientError(error, "Failed to create session");
  }
}

async function updateSession(
  input: UpdateAcademicSessionInput,
): Promise<AcademicSessionSummary> {
  try {
    const response = await api.patch<ApiResponse<AcademicSessionSummary>>(
      "/administrator/academic-sessions/update-session",
      input,
    );

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || "Failed to update session");
    }

    return response.data.data;
  } catch (error) {
    throw toApiClientError(error, "Failed to update session");
  }
}

async function deleteSession(
  input: DeleteAcademicSessionInput,
): Promise<{ id: string }> {
  try {
    const response = await api.delete<ApiResponse<{ id: string }>>(
      "/administrator/academic-sessions/delete-session",
      { data: input },
    );

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || "Failed to delete session");
    }

    return response.data.data;
  } catch (error) {
    throw toApiClientError(error, "Failed to delete session");
  }
}

async function upsertSemester(
  input: UpsertSessionSemesterInput,
): Promise<AcademicSessionSemester | null> {
  try {
    const response = await api.patch<
      ApiResponse<AcademicSessionSemester | null>
    >("/administrator/academic-sessions/upsert-semester", input);

    if (!response.data.success) {
      throw new Error(response.data.message || "Failed to update semester");
    }

    return response.data.data ?? null;
  } catch (error) {
    throw toApiClientError(error, "Failed to update semester");
  }
}

async function setCurrentSemester(
  input: SetCurrentSemesterInput,
): Promise<AcademicSessionSummary> {
  try {
    const response = await api.patch<ApiResponse<AcademicSessionSummary>>(
      "/administrator/academic-sessions/set-current-semester",
      input,
    );

    if (!response.data.success || !response.data.data) {
      throw new Error(
        response.data.message || "Failed to set current semester",
      );
    }

    return response.data.data;
  } catch (error) {
    throw toApiClientError(error, "Failed to set current semester");
  }
}

export function useGetAcademicSessions() {
  return useQuery({
    queryKey: sessionsKeys.overview,
    queryFn: getSessions,
    staleTime: 60 * 1000,
  });
}

export function useCreateAcademicSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createSession,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: sessionsKeys.overview });
    },
  });
}

export function useUpdateAcademicSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateSession,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: sessionsKeys.overview });
    },
  });
}

export function useDeleteAcademicSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteSession,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: sessionsKeys.overview });
    },
  });
}

export function useUpsertSessionSemester() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: upsertSemester,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: sessionsKeys.overview });
    },
  });
}

export function useSetCurrentSemester() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: setCurrentSemester,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: sessionsKeys.overview });
    },
  });
}
