import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./prisma";
import { emailService } from "./email-service";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
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
  emailAndPassword: {
    enabled: true,
    resetPasswordTokenExpiresIn: 15 * 60,
    sendResetPassword: async ({ user, url, token }) => {
      try {
        await emailService.sendForgotPasswordEmail({
          userEmail: user.email,
          userName: user.name || undefined,
          resetUrl: url,
          token,
          expiresIn: "15 minutes",
        });
      } catch (error) {
        const isDev = process.env.NODE_ENV !== "production";
        if (isDev) {
          console.error("[Better Auth] Failed to send reset email", error);
        }
        throw error;
      }
    },
  },
});
