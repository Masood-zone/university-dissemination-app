import { createAuthClient } from "better-auth/react";
import type { BetterAuthOptions } from "better-auth";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000";

export const authClient = createAuthClient({
  baseURL: API_BASE_URL,
  $InferAuth: {
    user: {
      additionalFields: {
        role: {
          type: ["ADMIN", "DEPARTMENT_ADMIN", "LECTURER", "STUDENT"],
          required: false,
          input: false,
          returned: true,
        },
      },
    },
  } satisfies BetterAuthOptions,
});

export const { signIn, signUp, useSession, signOut } = authClient;
