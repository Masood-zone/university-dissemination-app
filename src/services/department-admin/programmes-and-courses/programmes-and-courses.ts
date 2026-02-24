import api from "@/lib/axios";
import type {
  ApiResponse,
  DepartmentAdminCourseListResult,
  DepartmentAdminCourseOfferingListResult,
  DepartmentAdminCourseOfferingView,
  DepartmentAdminCreateCourseInput,
  DepartmentAdminLecturerOption,
  DepartmentAdminProgrammeOption,
  DepartmentAdminUpdateCourseInput,
} from "@/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

async function fetchProgrammes(): Promise<DepartmentAdminProgrammeOption[]> {
  const response = await api.get<ApiResponse<DepartmentAdminProgrammeOption[]>>(
    "/department-admin/programmes-and-courses/programmes",
  );

  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.message || "Failed to load programmes");
  }

  return response.data.data;
}

export function useDepartmentAdminProgrammes() {
  return useQuery({
    queryKey: ["deptAdminProgrammes"],
    queryFn: fetchProgrammes,
    staleTime: 60 * 1000,
  });
}

async function fetchLecturers(): Promise<DepartmentAdminLecturerOption[]> {
  const response = await api.get<ApiResponse<DepartmentAdminLecturerOption[]>>(
    "/department-admin/programmes-and-courses/lecturers",
  );

  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.message || "Failed to load lecturers");
  }

  return response.data.data;
}

export function useDepartmentAdminLecturers() {
  return useQuery({
    queryKey: ["deptAdminCourseLecturers"],
    queryFn: fetchLecturers,
    staleTime: 30 * 1000,
  });
}

async function fetchOfferings(
  view: DepartmentAdminCourseOfferingView,
): Promise<DepartmentAdminCourseOfferingListResult> {
  const response = await api.get<
    ApiResponse<DepartmentAdminCourseOfferingListResult>
  >("/department-admin/programmes-and-courses/offerings", {
    params: { view },
  });

  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.message || "Failed to load offerings");
  }

  return response.data.data;
}

export function useDepartmentAdminCourseOfferings(
  view: DepartmentAdminCourseOfferingView,
) {
  return useQuery({
    queryKey: ["deptAdminCourseOfferings", view],
    queryFn: () => fetchOfferings(view),
    staleTime: 15 * 1000,
  });
}

export type DepartmentAdminCoursesParams = {
  programmeId?: string;
  search?: string;
};

async function fetchCoursesByParams(
  params: DepartmentAdminCoursesParams,
): Promise<DepartmentAdminCourseListResult> {
  const response = await api.get<ApiResponse<DepartmentAdminCourseListResult>>(
    "/department-admin/programmes-and-courses/courses",
    { params },
  );

  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.message || "Failed to load courses");
  }

  return response.data.data;
}

export function useDepartmentAdminCourses(
  params: DepartmentAdminCoursesParams,
) {
  return useQuery({
    queryKey: ["deptAdminCourses", params],
    queryFn: () => fetchCoursesByParams(params),
    enabled: Boolean(params.programmeId || params.search),
    staleTime: 30 * 1000,
  });
}

export function useDepartmentAdminCreateCourse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: DepartmentAdminCreateCourseInput) => {
      const response = await api.post<ApiResponse<{ id: string }>>(
        "/department-admin/programmes-and-courses/courses",
        input,
      );

      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.message || "Failed to create course");
      }

      return response.data.data;
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["deptAdminCourseOfferings"],
        }),
        queryClient.invalidateQueries({ queryKey: ["deptAdminCourses"] }),
        queryClient.invalidateQueries({
          queryKey: ["deptAdminCourseLecturers"],
        }),
      ]);
    },
  });
}

export function useDepartmentAdminUpdateCourse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      input,
    }: {
      id: string;
      input: DepartmentAdminUpdateCourseInput;
    }) => {
      const response = await api.patch<ApiResponse<{ id: string }>>(
        `/department-admin/programmes-and-courses/courses/${id}`,
        input,
      );

      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.message || "Failed to update course");
      }

      return response.data.data;
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["deptAdminCourseOfferings"],
        }),
        queryClient.invalidateQueries({ queryKey: ["deptAdminCourses"] }),
      ]);
    },
  });
}

export function useDepartmentAdminDeleteCourse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete<ApiResponse<{ id: string }>>(
        `/department-admin/programmes-and-courses/courses/${id}`,
      );

      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.message || "Failed to delete course");
      }

      return response.data.data;
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["deptAdminCourseOfferings"],
        }),
        queryClient.invalidateQueries({ queryKey: ["deptAdminCourses"] }),
        queryClient.invalidateQueries({
          queryKey: ["deptAdminCourseLecturers"],
        }),
      ]);
    },
  });
}

export function useDepartmentAdminSetOfferingLecturer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      offeringId,
      lecturerId,
    }: {
      offeringId: string;
      lecturerId: string | null;
    }) => {
      const response = await api.put<
        ApiResponse<{ offeringId: string; lecturerId: string | null }>
      >(
        `/department-admin/programmes-and-courses/offerings/${offeringId}/assignment`,
        {
          lecturerId,
        },
      );

      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.message || "Failed to update assignment");
      }

      return response.data.data;
    },
    onSuccess: async (_data, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["deptAdminCourseOfferings"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["deptAdminCourseLecturers"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["deptAdminCourseOfferings", "CURRENT"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["deptAdminCourseOfferings", "ARCHIVES"],
        }),
      ]);

      // keep eslint happy about unused vars
      void variables;
    },
  });
}

export function useDepartmentAdminRemoveOffering() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (offeringId: string) => {
      const response = await api.delete<ApiResponse<{ id: string }>>(
        `/department-admin/programmes-and-courses/offerings/${offeringId}`,
      );

      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.message || "Failed to remove offering");
      }

      return response.data.data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["deptAdminCourseOfferings"],
      });
    },
  });
}
