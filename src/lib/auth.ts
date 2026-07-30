import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { phoneNumber } from "better-auth/plugins";
import { NotificationType } from "@prisma/client";
import { prisma } from "./prisma";
import { emailService } from "./email-service";
import { notificationService } from "./notification-service";
import { smsService } from "./sms-service";
import { normalizeGhanaPhone } from "./phone";

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
    revokeSessionsOnPasswordReset: true,
    onPasswordReset: async ({ user }) => {
      await Promise.allSettled([
        emailService.sendPasswordResetConfirmationEmail({
          userEmail: user.email,
          userName: user.name || undefined,
        }),
        prisma.user
          .findUnique({
            where: { id: user.id },
            select: { phoneNumber: true },
          })
          .then((found) =>
            found?.phoneNumber
              ? smsService.sendPasswordResetConfirmationSMS({
                  to: found.phoneNumber,
                })
              : undefined,
          ),
      ]);
    },
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
  plugins: [
    phoneNumber({
      otpLength: 6,
      expiresIn: 5 * 60,
      allowedAttempts: 3,
      phoneNumberValidator: (value) => normalizeGhanaPhone(value) === value,
      sendOTP: ({ phoneNumber: to, code }) =>
        smsService.sendPhoneVerificationOTP({ to, code }),
      sendPasswordResetOTP: ({ phoneNumber: to, code }) =>
        smsService.sendPhoneVerificationOTP({ to, code }),
    }),
  ],
});
