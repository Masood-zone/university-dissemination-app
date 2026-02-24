import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { NotificationType } from "@prisma/client";
import { prisma } from "./prisma";
import { emailService } from "./email-service";
import { notificationService } from "./notification-service";

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
      const baseMetadata = {
        channels: {
          email: {
            to: user.email,
            subject: `Reset Your Password - ${process.env.APP_NAME || "SIDS"}`,
            status: "PENDING",
          },
        },
      } as const;

      const notification = await notificationService.create({
        userId: user.id,
        type: NotificationType.SYSTEM,
        title: "Password reset requested",
        message:
          "We received a request to reset your password. Check your email for the reset link.",
        metadata: baseMetadata,
      });

      try {
        await emailService.sendForgotPasswordEmail({
          userEmail: user.email,
          userName: user.name || undefined,
          resetUrl: url,
          token,
          expiresIn: "15 minutes",
        });

        await notificationService.setMetadata(notification.id, {
          ...baseMetadata,
          channels: {
            ...baseMetadata.channels,
            email: {
              ...baseMetadata.channels.email,
              status: "SENT",
            },
          },
        });
      } catch (error) {
        await notificationService.setMetadata(notification.id, {
          ...baseMetadata,
          channels: {
            ...baseMetadata.channels,
            email: {
              ...baseMetadata.channels.email,
              status: "FAILED",
            },
          },
        });

        const isDev = process.env.NODE_ENV !== "production";
        if (isDev) {
          console.error("[Better Auth] Failed to send reset email", error);
        }
        throw error;
      }
    },
  },
});
