import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import api from "@/lib/axios";
import { toApiClientError } from "@/lib/api-client-error";
import type {
  ApiResponse,
  StudentFinancePayInput,
  StudentFinancePayResult,
  StudentFinanceSummary,
} from "@/types";

const financeKeys = {
  summary: ["student", "finance", "summary"] as const,
};

async function getStudentFinanceSummary(): Promise<StudentFinanceSummary> {
  try {
    const res =
      await api.get<ApiResponse<StudentFinanceSummary>>("/student/finance");
    if (!res.data.success || !res.data.data) {
      throw new Error(res.data.message || "Failed to load finance summary");
    }
    return res.data.data;
  } catch (error) {
    throw toApiClientError(error, "Failed to load finance summary");
  }
}

async function payStudentFee(
  payload: StudentFinancePayInput,
): Promise<StudentFinancePayResult> {
  try {
    const res = await api.post<ApiResponse<StudentFinancePayResult>>(
      "/student/finance",
      payload,
    );
    if (!res.data.success || !res.data.data) {
      throw new Error(res.data.message || "Failed to record payment");
    }
    return res.data.data;
  } catch (error) {
    throw toApiClientError(error, "Failed to record payment");
  }
}

export function useGetStudentFinanceSummary() {
  return useQuery({
    queryKey: financeKeys.summary,
    queryFn: getStudentFinanceSummary,
    staleTime: 20 * 1000,
  });
}

export function usePayStudentFee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: payStudentFee,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: financeKeys.summary });
      await queryClient.invalidateQueries({
        queryKey: ["student-dashboard", "analytics"],
      });
      await queryClient.invalidateQueries({
        queryKey: ["admin", "finance", "analytics"],
      });
      await queryClient.invalidateQueries({
        queryKey: ["admin", "finance", "transactions"],
      });
    },
  });
}
