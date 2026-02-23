import { create } from "zustand";
import { persist } from "zustand/middleware";
import { UserSession } from "@/types";
import { Role } from "@prisma/client";

interface AuthStore {
  user: UserSession | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;

  // Actions
  setUser: (user: UserSession) => void;
  clearUser: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  hasPermission: (action: string, resource?: string) => boolean;
  hasRole: (roles: Role | Role[]) => boolean;
  logout: () => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      isLoading: false,
      isAuthenticated: false,
      error: null,

      setUser: (user) =>
        set({
          user,
          isAuthenticated: true,
          error: null,
        }),

      clearUser: () =>
        set({
          user: null,
          isAuthenticated: false,
          error: null,
        }),

      setLoading: (isLoading) => set({ isLoading }),

      setError: (error) => set({ error }),

      hasPermission: (action, resource) => {
        const { user } = get();
        if (!user) return false;

        // Admin has all permissions
        if (user.role === "ADMIN") return true;

        // Add role-based permission logic here
        return false;
      },

      hasRole: (roles) => {
        const { user } = get();
        if (!user) return false;

        const roleArray = Array.isArray(roles) ? roles : [roles];
        return roleArray.includes(user.role);
      },

      logout: () => {
        set({
          user: null,
          isAuthenticated: false,
          error: null,
        });
      },
    }),
    {
      name: "authentication-store",
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
