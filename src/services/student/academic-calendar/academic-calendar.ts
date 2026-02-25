import { useQuery } from "@tanstack/react-query";

import api from "@/lib/axios";
import { toApiClientError } from "@/lib/api-client-error";
import type { ApiResponse, StudentAcademicCalendarResponse } from "@/types";

const academicCalendarKeys = {
  week: ["student", "academic-calendar", "week"] as const,
};

async function getStudentAcademicCalendarWeek(): Promise<StudentAcademicCalendarResponse> {
  try {
    const res = await api.get<ApiResponse<StudentAcademicCalendarResponse>>(
      "/student/academic-calendar",
    );
    if (!res.data.success || !res.data.data) {
      throw new Error(res.data.message || "Failed to load academic calendar");
    }
    return res.data.data;
  } catch (error) {
    throw toApiClientError(error, "Failed to load academic calendar");
  }
}

export function useStudentAcademicCalendarWeek(enabled = true) {
  return useQuery({
    queryKey: academicCalendarKeys.week,
    queryFn: getStudentAcademicCalendarWeek,
    enabled,
    staleTime: 30 * 1000,
  });
}
