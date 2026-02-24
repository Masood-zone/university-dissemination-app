import { useQuery } from "@tanstack/react-query";

import api from "@/lib/axios";
import { toApiClientError } from "@/lib/api-client-error";
import type {
	ApiResponse,
	StudentAnnouncementDetailResult,
	StudentAnnouncementPriorityFilter,
	StudentAnnouncementsFeedResult,
	StudentAnnouncementsSort,
} from "@/types";

export type StudentAnnouncementsFeedParams = {
	q?: string;
	category?: string;
	priority?: StudentAnnouncementPriorityFilter;
	sort?: StudentAnnouncementsSort;
	page?: number;
	pageSize?: number;
};

const announcementKeys = {
	feed: (params: StudentAnnouncementsFeedParams) =>
		[
			"announcements",
			"feed",
			params.q || "",
			params.category || "",
			params.priority || "ALL",
			params.sort || "RECENT",
			params.page || 1,
			params.pageSize || 10,
		] as const,
	detail: (id: string) => ["announcements", "detail", id] as const,
};

function buildFeedQuery(params: StudentAnnouncementsFeedParams) {
	const sp = new URLSearchParams();
	if (params.q) sp.set("q", params.q);
	if (params.category) sp.set("category", params.category);
	if (params.priority && params.priority !== "ALL")
		sp.set("priority", params.priority);
	if (params.sort && params.sort !== "RECENT") sp.set("sort", params.sort);
	if (params.page && params.page !== 1) sp.set("page", String(params.page));
	if (params.pageSize && params.pageSize !== 10)
		sp.set("pageSize", String(params.pageSize));
	return sp;
}

async function getStudentAnnouncementsFeed(
	params: StudentAnnouncementsFeedParams,
): Promise<StudentAnnouncementsFeedResult> {
	try {
		const sp = buildFeedQuery(params);
		const url = sp.size ? `/announcements?${sp.toString()}` : "/announcements";

		const res = await api.get<ApiResponse<StudentAnnouncementsFeedResult>>(url);

		if (!res.data.success || !res.data.data) {
			throw new Error(res.data.message || "Failed to load announcements");
		}

		return res.data.data;
	} catch (error) {
		throw toApiClientError(error, "Failed to load announcements");
	}
}

async function getStudentAnnouncementDetail(
	id: string,
): Promise<StudentAnnouncementDetailResult> {
	try {
		const res = await api.get<ApiResponse<StudentAnnouncementDetailResult>>(
			`/announcements/${id}`,
		);

		if (!res.data.success || !res.data.data) {
			throw new Error(res.data.message || "Failed to load announcement");
		}

		return res.data.data;
	} catch (error) {
		throw toApiClientError(error, "Failed to load announcement");
	}
}

export function useStudentAnnouncementsFeed(
	params: StudentAnnouncementsFeedParams,
	enabled: boolean = true,
) {
	return useQuery({
		queryKey: announcementKeys.feed(params),
		queryFn: () => getStudentAnnouncementsFeed(params),
		enabled,
		staleTime: 20 * 1000,
	});
}

export function useStudentAnnouncementDetail(id: string, enabled: boolean = true) {
	return useQuery({
		queryKey: announcementKeys.detail(id),
		queryFn: () => getStudentAnnouncementDetail(id),
		enabled: enabled && Boolean(id),
		staleTime: 20 * 1000,
	});
}

