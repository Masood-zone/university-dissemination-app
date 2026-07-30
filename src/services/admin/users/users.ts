import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import type { Role } from "@prisma/client";

import api from "@/lib/axios";
import { toApiClientError } from "@/lib/api-client-error";

export type AdminUserInput = {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  password?: string;
  role: Role;
  departmentId?: string | null;
  staffId?: string | null;
  employeeId?: string | null;
  qualification?: string | null;
  specialization?: string | null;
  office?: string | null;
  studentId?: string | null;
  batch?: string | null;
  isActive?: boolean;
};

export type AdminUserRow = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  role: Role;
  isActive: boolean;
  emailVerified: boolean;
  phoneRecoveryReady: boolean;
  systemId: string | null;
  createdAt: string;
  department: { id: string; name: string } | null;
};

type ListResult = {
  rows: AdminUserRow[];
  stats: Record<Role, number>;
  departments: Array<{ id: string; name: string; code: string }>;
  total: number;
  page: number;
  pageSize: number;
};

type Envelope<T> = {
  success: boolean;
  data?: T;
  message?: string;
};

const keys = {
  all: ["admin", "users"] as const,
  list: (params: Record<string, unknown>) =>
    ["admin", "users", "list", params] as const,
};

export function useAdminUsers(params: {
  q: string;
  role: string;
  status: string;
  departmentId: string;
  page: number;
  pageSize: number;
}) {
  return useQuery({
    queryKey: keys.list(params),
    queryFn: async () => {
      try {
        const response = await api.get<Envelope<ListResult>>(
          "/administrator/users",
          { params },
        );
        if (!response.data.success || !response.data.data) {
          throw new Error(response.data.message || "Failed to load users");
        }
        return response.data.data;
      } catch (error) {
        throw toApiClientError(error, "Failed to load users");
      }
    },
    placeholderData: keepPreviousData,
  });
}

export function useCreateAdminUser() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (input: AdminUserInput) => {
      const response = await api.post<
        Envelope<{ id: string; temporaryPassword: string }>
      >("/administrator/users", input);
      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.message || "Failed to create user");
      }
      return response.data.data;
    },
    onSuccess: () => client.invalidateQueries({ queryKey: keys.all }),
  });
}

export function useUpdateAdminUser() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      input,
    }: {
      id: string;
      input: Partial<AdminUserInput>;
    }) => {
      const response = await api.patch<Envelope<{ id: string }>>(
        `/administrator/users/${id}`,
        input,
      );
      if (!response.data.success) {
        throw new Error(response.data.message || "Failed to update user");
      }
      return response.data.data;
    },
    onSuccess: () => client.invalidateQueries({ queryKey: keys.all }),
  });
}

export function useDeactivateAdminUser() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete<Envelope<{ id: string }>>(
        `/administrator/users/${id}`,
      );
      if (!response.data.success) {
        throw new Error(response.data.message || "Failed to deactivate user");
      }
      return response.data.data;
    },
    onSuccess: () => client.invalidateQueries({ queryKey: keys.all }),
  });
}
