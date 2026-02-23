import { createAuthClient } from "better-auth/react";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000";

export const authClient = createAuthClient({
  baseURL: API_BASE_URL,
});

export const { signIn, signUp, useSession, signOut } = authClient;
