import { useQuery } from "@tanstack/react-query";

import api from "@/lib/axios";
import { toApiClientError } from "@/lib/api-client-error";
import type { ApiResponse } from "@/types";

import type { LecturerCoursesResponse } from "@/app/api/lecturer/courses/route";

const courseKeys = {
  all: ["lecturer", "courses"] as const,
};

async function getLecturerCourses(): Promise<LecturerCoursesResponse> {
  try {
    const res =
      await api.get<ApiResponse<LecturerCoursesResponse>>("/lecturer/courses");

    if (!res.data.success || !res.data.data) {
      throw new Error(res.data.message || "Failed to load courses");
    }

    return res.data.data;
  } catch (error) {
    throw toApiClientError(error, "Failed to load courses");
  }
}

export function useLecturerCourses() {
  return useQuery({
    queryKey: courseKeys.all,
    queryFn: getLecturerCourses,
    staleTime: 30 * 1000,
  });
}

export { courseKeys };
