import { useQuery } from "@tanstack/react-query";

import api from "@/lib/axios";
import { toApiClientError } from "@/lib/api-client-error";
import type { ApiResponse, StudentCourseOfferingsResponse } from "@/types";

const courseOfferingsKeys = {
  enrolled: ["student", "course-offerings", "enrolled"] as const,
};

async function getStudentCourseOfferings(): Promise<StudentCourseOfferingsResponse> {
  try {
    const res = await api.get<ApiResponse<StudentCourseOfferingsResponse>>(
      "/student/course-offerings",
    );
    if (!res.data.success || !res.data.data) {
      throw new Error(res.data.message || "Failed to load course offerings");
    }
    return res.data.data;
  } catch (error) {
    throw toApiClientError(error, "Failed to load course offerings");
  }
}

export function useStudentCourseOfferings(enabled = true) {
  return useQuery({
    queryKey: courseOfferingsKeys.enrolled,
    queryFn: getStudentCourseOfferings,
    enabled,
    staleTime: 30 * 1000,
  });
}
