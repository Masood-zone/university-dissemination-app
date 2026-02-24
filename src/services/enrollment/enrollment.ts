import { useMutation, useQuery } from "@tanstack/react-query";

import api from "@/lib/axios";
import { toApiClientError } from "@/lib/api-client-error";
import type {
  ApiResponse,
  EnrollmentCourse,
  EnrollmentDepartment,
  EnrollmentProgramme,
  EnrollmentStatusResult,
  EnrollmentSubmitInput,
  EnrollmentSubmitResult,
} from "@/types";

const enrollmentKeys = {
  departments: ["enrollment", "departments"] as const,
  programmes: (departmentId: string) =>
    ["enrollment", "programmes", departmentId] as const,
  courses: (programmeId: string) =>
    ["enrollment", "courses", programmeId] as const,
  status: ["enrollment", "status"] as const,
};

async function getDepartments(): Promise<EnrollmentDepartment[]> {
  try {
    const res = await api.get<ApiResponse<EnrollmentDepartment[]>>(
      "/enrollment/departments",
    );

    if (!res.data.success || !res.data.data) {
      throw new Error(res.data.message || "Failed to load departments");
    }

    return res.data.data;
  } catch (error) {
    throw toApiClientError(error, "Failed to load departments");
  }
}

async function getProgrammes(
  departmentId: string,
): Promise<EnrollmentProgramme[]> {
  try {
    const res = await api.get<ApiResponse<EnrollmentProgramme[]>>(
      "/enrollment/programmes",
      { params: { departmentId } },
    );

    if (!res.data.success || !res.data.data) {
      throw new Error(res.data.message || "Failed to load programmes");
    }

    return res.data.data;
  } catch (error) {
    throw toApiClientError(error, "Failed to load programmes");
  }
}

async function getCourses(programmeId: string): Promise<EnrollmentCourse[]> {
  try {
    const res = await api.get<ApiResponse<EnrollmentCourse[]>>(
      "/enrollment/courses",
      { params: { programmeId } },
    );

    if (!res.data.success || !res.data.data) {
      throw new Error(res.data.message || "Failed to load courses");
    }

    return res.data.data;
  } catch (error) {
    throw toApiClientError(error, "Failed to load courses");
  }
}

async function submitEnrollment(
  payload: EnrollmentSubmitInput,
): Promise<EnrollmentSubmitResult> {
  try {
    const res = await api.post<ApiResponse<EnrollmentSubmitResult>>(
      "/enrollment/submit",
      payload,
    );

    if (!res.data.success || !res.data.data) {
      throw new Error(res.data.message || "Failed to submit enrollment");
    }

    return res.data.data;
  } catch (error) {
    throw toApiClientError(error, "Failed to submit enrollment");
  }
}

async function getEnrollmentStatus(): Promise<EnrollmentStatusResult> {
  try {
    const res =
      await api.get<ApiResponse<EnrollmentStatusResult>>("/enrollment/status");

    if (!res.data.success || !res.data.data) {
      throw new Error(res.data.message || "Failed to load status");
    }

    return res.data.data;
  } catch (error) {
    throw toApiClientError(error, "Failed to load status");
  }
}

export function useGetEnrollmentDepartments() {
  return useQuery({
    queryKey: enrollmentKeys.departments,
    queryFn: getDepartments,
    staleTime: 5 * 60 * 1000,
  });
}

export function useGetEnrollmentProgrammes(departmentId: string | null) {
  return useQuery({
    queryKey: departmentId
      ? enrollmentKeys.programmes(departmentId)
      : ["enrollment", "programmes", null],
    queryFn: () => {
      if (!departmentId) throw new Error("Missing departmentId");
      return getProgrammes(departmentId);
    },
    enabled: Boolean(departmentId),
    staleTime: 5 * 60 * 1000,
  });
}

export function useGetEnrollmentCourses(programmeId: string | null) {
  return useQuery({
    queryKey: programmeId
      ? enrollmentKeys.courses(programmeId)
      : ["enrollment", "courses", null],
    queryFn: () => {
      if (!programmeId) throw new Error("Missing programmeId");
      return getCourses(programmeId);
    },
    enabled: Boolean(programmeId),
    staleTime: 5 * 60 * 1000,
  });
}

export function useSubmitEnrollment() {
  return useMutation({
    mutationFn: submitEnrollment,
  });
}

export function useGetEnrollmentStatus() {
  return useQuery({
    queryKey: enrollmentKeys.status,
    queryFn: getEnrollmentStatus,
    staleTime: 15 * 1000,
  });
}
