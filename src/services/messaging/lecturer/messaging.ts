import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import api from "@/lib/axios";
import { toApiClientError } from "@/lib/api-client-error";
import type { ApiResponse } from "@/types";

import type { LecturerMessagingCoursesResponse } from "@/app/api/messaging/lecturer/courses/route";
import type { LecturerMessagingStudentsResponse } from "@/app/api/messaging/lecturer/students/route";
import type { LecturerMessagingThreadsResponse } from "@/app/api/messaging/lecturer/threads/route";
import type {
  LecturerConversationResponse,
  LecturerSendMessageInput,
  MessagingMessageRow,
} from "@/app/api/messaging/lecturer/messages/route";

const lecturerMessagingKeys = {
  courses: ["messaging", "lecturer", "courses"] as const,
  students: (offeringId?: string) =>
    ["messaging", "lecturer", "students", offeringId ?? "all"] as const,
  threads: (offeringId?: string, q?: string) =>
    ["messaging", "lecturer", "threads", offeringId ?? "all", q ?? ""] as const,
  conversation: (withUserId: string) =>
    ["messaging", "lecturer", "conversation", withUserId] as const,
};

async function getCourses(): Promise<LecturerMessagingCoursesResponse> {
  try {
    const res = await api.get<ApiResponse<LecturerMessagingCoursesResponse>>(
      "/messaging/lecturer/courses",
    );

    if (!res.data.success || !res.data.data) {
      throw new Error(res.data.message || "Failed to load courses");
    }

    return res.data.data;
  } catch (error) {
    throw toApiClientError(error, "Failed to load courses");
  }
}

async function getStudents(
  offeringId?: string,
): Promise<LecturerMessagingStudentsResponse> {
  try {
    const res = await api.get<ApiResponse<LecturerMessagingStudentsResponse>>(
      "/messaging/lecturer/students",
      { params: offeringId ? { offeringId } : undefined },
    );

    if (!res.data.success || !res.data.data) {
      throw new Error(res.data.message || "Failed to load students");
    }

    return res.data.data;
  } catch (error) {
    throw toApiClientError(error, "Failed to load students");
  }
}

async function getThreads(params: {
  offeringId?: string;
  q?: string;
}): Promise<LecturerMessagingThreadsResponse> {
  try {
    const res = await api.get<ApiResponse<LecturerMessagingThreadsResponse>>(
      "/messaging/lecturer/threads",
      {
        params: {
          ...(params.offeringId ? { offeringId: params.offeringId } : null),
          ...(params.q ? { q: params.q } : null),
        },
      },
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
): Promise<LecturerConversationResponse> {
  try {
    const res = await api.get<ApiResponse<LecturerConversationResponse>>(
      "/messaging/lecturer/messages",
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
  input: LecturerSendMessageInput,
): Promise<{ count: number } | MessagingMessageRow> {
  try {
    const res = await api.post<
      ApiResponse<{ count: number } | MessagingMessageRow>
    >("/messaging/lecturer/messages", input);

    if (!res.data.success || !res.data.data) {
      throw new Error(res.data.message || "Failed to send message");
    }

    return res.data.data;
  } catch (error) {
    throw toApiClientError(error, "Failed to send message");
  }
}

export function useLecturerMessagingCourses() {
  return useQuery({
    queryKey: lecturerMessagingKeys.courses,
    queryFn: getCourses,
    staleTime: 30 * 1000,
  });
}

export function useLecturerMessagingStudents(offeringId?: string) {
  return useQuery({
    queryKey: lecturerMessagingKeys.students(offeringId),
    queryFn: () => getStudents(offeringId),
    enabled: true,
    staleTime: 15 * 1000,
  });
}

export function useLecturerMessagingThreads(params: {
  offeringId?: string;
  q?: string;
}) {
  return useQuery({
    queryKey: lecturerMessagingKeys.threads(params.offeringId, params.q),
    queryFn: () => getThreads(params),
    staleTime: 10 * 1000,
  });
}

export function useLecturerConversation(withUserId: string | null) {
  return useQuery({
    queryKey: withUserId
      ? lecturerMessagingKeys.conversation(withUserId)
      : ["messaging", "lecturer", "conversation", "none"],
    queryFn: () => {
      if (!withUserId) {
        return Promise.resolve({ rows: [] } as LecturerConversationResponse);
      }
      return getConversation(withUserId);
    },
    enabled: Boolean(withUserId),
    staleTime: 2 * 1000,
  });
}

export function useLecturerSendMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: sendMessage,
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({
        queryKey: lecturerMessagingKeys.threads(
          variables.offeringId ?? undefined,
          "",
        ),
      });

      if (variables.recipientIds.length === 1) {
        await queryClient.invalidateQueries({
          queryKey: lecturerMessagingKeys.conversation(
            variables.recipientIds[0],
          ),
        });
      }
    },
  });
}

export { lecturerMessagingKeys };
