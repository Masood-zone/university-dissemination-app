import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import api from "@/lib/axios";
import { toApiClientError } from "@/lib/api-client-error";
import type { ApiResponse } from "@/types";

import type { StudentMessagingThreadsResponse } from "@/app/api/messaging/student/threads/route";
import type {
  StudentConversationResponse,
  StudentSendMessageInput,
  MessagingMessageRow,
} from "@/app/api/messaging/student/messages/route";

const studentMessagingKeys = {
  threads: ["messaging", "student", "threads"] as const,
  conversation: (withUserId: string) =>
    ["messaging", "student", "conversation", withUserId] as const,
};

async function getThreads(): Promise<StudentMessagingThreadsResponse> {
  try {
    const res = await api.get<ApiResponse<StudentMessagingThreadsResponse>>(
      "/messaging/student/threads",
    );

    if (!res.data.success || !res.data.data) {
      throw new Error(res.data.message || "Failed to load threads");
    }

    return res.data.data;
  } catch (error) {
    throw toApiClientError(error, "Failed to load threads");
  }
}

async function getConversation(
  withUserId: string,
): Promise<StudentConversationResponse> {
  try {
    const res = await api.get<ApiResponse<StudentConversationResponse>>(
      "/messaging/student/messages",
      { params: { withUserId } },
    );

    if (!res.data.success || !res.data.data) {
      throw new Error(res.data.message || "Failed to load messages");
    }

    return res.data.data;
  } catch (error) {
    throw toApiClientError(error, "Failed to load messages");
  }
}

async function sendMessage(
  input: StudentSendMessageInput,
): Promise<MessagingMessageRow> {
  try {
    const res = await api.post<ApiResponse<MessagingMessageRow>>(
      "/messaging/student/messages",
      input,
    );

    if (!res.data.success || !res.data.data) {
      throw new Error(res.data.message || "Failed to send message");
    }

    return res.data.data;
  } catch (error) {
    throw toApiClientError(error, "Failed to send message");
  }
}

export function useStudentMessagingThreads() {
  return useQuery({
    queryKey: studentMessagingKeys.threads,
    queryFn: getThreads,
    staleTime: 10 * 1000,
  });
}

export function useStudentConversation(withUserId: string | null) {
  return useQuery({
    queryKey: withUserId
      ? studentMessagingKeys.conversation(withUserId)
      : ["messaging", "student", "conversation", "none"],
    queryFn: () => {
      if (!withUserId) {
        return Promise.resolve({ rows: [] } as StudentConversationResponse);
      }
      return getConversation(withUserId);
    },
    enabled: Boolean(withUserId),
    staleTime: 2 * 1000,
  });
}

export function useStudentSendMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: sendMessage,
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({
        queryKey: studentMessagingKeys.threads,
      });
      await queryClient.invalidateQueries({
        queryKey: studentMessagingKeys.conversation(variables.recipientId),
      });
    },
  });
}

export { studentMessagingKeys };
