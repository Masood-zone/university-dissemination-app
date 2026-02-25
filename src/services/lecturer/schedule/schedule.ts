import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import api from "@/lib/axios";
import { toApiClientError } from "@/lib/api-client-error";
import type { ApiResponse } from "@/types";

import type {
  CreateExamInput,
  LecturerScheduleEventRow,
  LecturerScheduleResponse,
  UpdateScheduleEventInput,
} from "@/app/api/lecturer/schedule/route";

const scheduleKeys = {
  all: ["lecturer", "schedule"] as const,
};

async function getLecturerSchedule(): Promise<LecturerScheduleResponse> {
  try {
    const res =
      await api.get<ApiResponse<LecturerScheduleResponse>>(
        "/lecturer/schedule",
      );

    if (!res.data.success || !res.data.data) {
      throw new Error(res.data.message || "Failed to load schedule");
    }

    return res.data.data;
  } catch (error) {
    throw toApiClientError(error, "Failed to load schedule");
  }
}

async function updateScheduleEvent(
  input: UpdateScheduleEventInput,
): Promise<void> {
  try {
    const res = await api.patch<ApiResponse<unknown>>(
      "/lecturer/schedule",
      input,
    );

    if (!res.data.success) {
      throw new Error(res.data.message || "Failed to update schedule");
    }
  } catch (error) {
    throw toApiClientError(error, "Failed to update schedule");
  }
}

async function createExam(
  input: CreateExamInput,
): Promise<LecturerScheduleEventRow> {
  try {
    const res = await api.post<ApiResponse<LecturerScheduleEventRow>>(
      "/lecturer/schedule",
      input,
    );

    if (!res.data.success || !res.data.data) {
      throw new Error(res.data.message || "Failed to create exam");
    }

    return res.data.data;
  } catch (error) {
    throw toApiClientError(error, "Failed to create exam");
  }
}

export function useLecturerSchedule() {
  return useQuery({
    queryKey: scheduleKeys.all,
    queryFn: getLecturerSchedule,
    staleTime: 10 * 1000,
  });
}

export function useUpdateScheduleEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateScheduleEvent,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: scheduleKeys.all });
    },
  });
}

export function useCreateExam() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createExam,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: scheduleKeys.all });
    },
  });
}

export { scheduleKeys };
