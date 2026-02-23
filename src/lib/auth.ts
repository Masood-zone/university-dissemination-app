import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./prisma";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
    sendResetPassword: async ({ user, url, token }) => {
      const isDev = process.env.NODE_ENV !== "production";
      if (isDev) {
        console.log("\n[Better Auth] Password reset requested");
        console.log("User:", user.email);
        console.log("Token:", token);
        console.log("URL:", url, "\n");
      }
    },
  },
});
