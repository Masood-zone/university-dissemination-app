import { create } from "zustand";
import { AnnouncementData, AnnouncementFeed } from "@/types";
import { AnnouncementCategory } from "@prisma/client";

interface AnnouncementFilters {
  category?: AnnouncementCategory;
  search?: string;
  departmentId?: string;
  pinned?: boolean;
}

interface AnnouncementStore {
  announcements: AnnouncementData[];
  feed: AnnouncementFeed | null;
  filters: AnnouncementFilters;
  isLoading: boolean;
  error: string | null;
  currentPage: number;
  pageSize: number;

  // Actions
  setAnnouncements: (announcements: AnnouncementData[]) => void;
  appendAnnouncements: (announcements: AnnouncementData[]) => void;
  setFeed: (feed: AnnouncementFeed) => void;
  addAnnouncement: (announcement: AnnouncementData) => void;
  updateAnnouncement: (
    id: string,
    announcement: Partial<AnnouncementData>,
  ) => void;
  removeAnnouncement: (id: string) => void;
  setFilters: (filters: AnnouncementFilters) => void;
  clearFilters: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setCurrentPage: (page: number) => void;
  setPageSize: (size: number) => void;
}

export const useAnnouncementStore = create<AnnouncementStore>((set, get) => ({
  announcements: [],
  feed: null,
  filters: {},
  isLoading: false,
  error: null,
  currentPage: 1,
  pageSize: 10,

  setAnnouncements: (announcements) => set({ announcements }),

  appendAnnouncements: (incoming) =>
    set((state) => {
      const existingIds = new Set(state.announcements.map((a) => a.id));
      const merged = [...state.announcements];
      for (const announcement of incoming) {
        if (!existingIds.has(announcement.id)) merged.push(announcement);
      }
      return { announcements: merged };
    }),

  setFeed: (feed) => set({ feed }),

  addAnnouncement: (announcement) =>
    set((state) => ({
      announcements: [announcement, ...state.announcements],
    })),

  updateAnnouncement: (id, updates) =>
    set((state) => ({
      announcements: state.announcements.map((a) =>
        a.id === id ? { ...a, ...updates } : a,
      ),
    })),

  removeAnnouncement: (id) =>
    set((state) => ({
      announcements: state.announcements.filter((a) => a.id !== id),
    })),

  setFilters: (filters) => set({ filters, currentPage: 1 }),

  clearFilters: () => set({ filters: {}, currentPage: 1 }),

  setLoading: (isLoading) => set({ isLoading }),

  setError: (error) => set({ error }),

  setCurrentPage: (page) => set({ currentPage: page }),

  setPageSize: (size) => set({ pageSize: size, currentPage: 1 }),
}));
