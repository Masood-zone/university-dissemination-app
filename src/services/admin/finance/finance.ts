import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import api from "@/lib/axios";
import { toApiClientError } from "@/lib/api-client-error";
import type {
  ApiResponse,
  FinanceAnalytics,
  FinanceProgrammeListItem,
  FinanceTransactionsResult,
  PaymentTransactionStatusFilter,
  ProgrammeFeeAllocation,
  UpsertProgrammeFeeInput,
} from "@/types";

const financeKeys = {
  analytics: ["admin", "finance", "analytics"] as const,
  transactions: (params: {
    q: string;
    range: "7d" | "30d" | "90d";
    status: PaymentTransactionStatusFilter;
  }) => ["admin", "finance", "transactions", params] as const,
  programmes: ["admin", "finance", "programmes"] as const,
  programmeFees: (programmeId: string, semester: "FIRST" | "SECOND") =>
    ["admin", "finance", "programme-fees", programmeId, semester] as const,
};

async function getFinanceAnalytics(): Promise<FinanceAnalytics> {
  try {
    const res = await api.get<ApiResponse<FinanceAnalytics>>(
      "/administrator/finance/analytics",
    );
    if (!res.data.success || !res.data.data) {
      throw new Error(res.data.message || "Failed to load analytics");
    }
    return res.data.data;
  } catch (error) {
    throw toApiClientError(error, "Failed to load analytics");
  }
}

async function getFinanceTransactions(params: {
  q: string;
  range: "7d" | "30d" | "90d";
  status: PaymentTransactionStatusFilter;
}): Promise<FinanceTransactionsResult> {
  try {
    const res = await api.get<ApiResponse<FinanceTransactionsResult>>(
      "/administrator/finance/transactions",
      { params },
    );
    if (!res.data.success || !res.data.data) {
      throw new Error(res.data.message || "Failed to load transactions");
    }
    return res.data.data;
  } catch (error) {
    throw toApiClientError(error, "Failed to load transactions");
  }
}

async function getFinanceProgrammes(): Promise<FinanceProgrammeListItem[]> {
  try {
    const res = await api.get<ApiResponse<FinanceProgrammeListItem[]>>(
      "/administrator/finance/programmes",
    );
    if (!res.data.success || !res.data.data) {
      throw new Error(res.data.message || "Failed to load programmes");
    }
    return res.data.data;
  } catch (error) {
    throw toApiClientError(error, "Failed to load programmes");
  }
}

async function getProgrammeFees(params: {
  programmeId: string;
  semester: "FIRST" | "SECOND";
}): Promise<ProgrammeFeeAllocation> {
  try {
    const res = await api.get<ApiResponse<ProgrammeFeeAllocation>>(
      "/administrator/finance/programme-fees",
      { params },
    );
    if (!res.data.success || !res.data.data) {
      throw new Error(res.data.message || "Failed to load programme fee");
    }
    return res.data.data;
  } catch (error) {
    throw toApiClientError(error, "Failed to load programme fee");
  }
}

async function upsertProgrammeFees(
  payload: UpsertProgrammeFeeInput,
): Promise<ProgrammeFeeAllocation> {
  try {
    const res = await api.post<ApiResponse<ProgrammeFeeAllocation>>(
      "/administrator/finance/programme-fees",
      payload,
    );
    if (!res.data.success || !res.data.data) {
      throw new Error(res.data.message || "Failed to update programme fee");
    }
    return res.data.data;
  } catch (error) {
    throw toApiClientError(error, "Failed to update programme fee");
  }
}

export function useGetFinanceAnalytics() {
  return useQuery({
    queryKey: financeKeys.analytics,
    queryFn: getFinanceAnalytics,
    staleTime: 30 * 1000,
  });
}

export function useGetFinanceTransactions(params: {
  q: string;
  range: "7d" | "30d" | "90d";
  status: PaymentTransactionStatusFilter;
}) {
  return useQuery({
    queryKey: financeKeys.transactions(params),
    queryFn: () => getFinanceTransactions(params),
    staleTime: 10 * 1000,
  });
}

export function useGetFinanceProgrammes() {
  return useQuery({
    queryKey: financeKeys.programmes,
    queryFn: getFinanceProgrammes,
    staleTime: 5 * 60 * 1000,
  });
}

export function useGetProgrammeFeeAllocation(
  programmeId: string | null,
  semester: "FIRST" | "SECOND",
) {
  return useQuery({
    queryKey: programmeId
      ? financeKeys.programmeFees(programmeId, semester)
      : ["admin", "finance", "programme-fees", null, semester],
    queryFn: () => {
      if (!programmeId) throw new Error("Missing programmeId");
      return getProgrammeFees({ programmeId, semester });
    },
    enabled: Boolean(programmeId),
    staleTime: 10 * 1000,
  });
}

export function useUpsertProgrammeFeeAllocation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: upsertProgrammeFees,
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({ queryKey: financeKeys.analytics });
      await queryClient.invalidateQueries({ queryKey: financeKeys.programmes });
      await queryClient.invalidateQueries({
        queryKey: financeKeys.programmeFees(
          variables.programmeId,
          variables.semester,
        ),
      });
    },
  });
}
