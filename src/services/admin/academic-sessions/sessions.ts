import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import api from "@/lib/axios";
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
  const response = await api.get<ApiResponse<AcademicSessionsOverviewResponse>>(
    "/administrators/academic-sessions/get-sessions",
  );

  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.message || "Failed to load sessions");
  }

  return response.data.data;
}

async function createSession(
  input: CreateAcademicSessionInput,
): Promise<AcademicSessionSummary> {
  const response = await api.post<ApiResponse<AcademicSessionSummary>>(
    "/administrators/academic-sessions/create-session",
    input,
  );

  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.message || "Failed to create session");
  }

  return response.data.data;
}

async function updateSession(
  input: UpdateAcademicSessionInput,
): Promise<AcademicSessionSummary> {
  const response = await api.patch<ApiResponse<AcademicSessionSummary>>(
    "/administrators/academic-sessions/update-session",
    input,
  );

  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.message || "Failed to update session");
  }

  return response.data.data;
}

async function deleteSession(
  input: DeleteAcademicSessionInput,
): Promise<{ id: string }> {
  const response = await api.delete<ApiResponse<{ id: string }>>(
    "/administrators/academic-sessions/delete-session",
    { data: input },
  );

  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.message || "Failed to delete session");
  }

  return response.data.data;
}

async function upsertSemester(
  input: UpsertSessionSemesterInput,
): Promise<AcademicSessionSemester | null> {
  const response = await api.patch<ApiResponse<AcademicSessionSemester | null>>(
    "/administrators/academic-sessions/upsert-semester",
    input,
  );

  if (!response.data.success) {
    throw new Error(response.data.message || "Failed to update semester");
  }

  return response.data.data ?? null;
}

async function setCurrentSemester(
  input: SetCurrentSemesterInput,
): Promise<AcademicSessionSummary> {
  const response = await api.patch<ApiResponse<AcademicSessionSummary>>(
    "/administrators/academic-sessions/set-current-semester",
    input,
  );

  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.message || "Failed to set current semester");
  }

  return response.data.data;
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
