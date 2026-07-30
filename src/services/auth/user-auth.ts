import { authClient } from "@/lib/auth-client";
import api from "@/lib/axios";

type AuthErrorLike = {
  message?: string;
  code?: string;
  status?: number;
};

export function getAuthErrorMessage(
  error: unknown,
  fallbackMessage = "Login failed. Please try again.",
) {
  if (error && typeof error === "object") {
    const authError = error as AuthErrorLike;

    if (authError.status === 401 || authError.code === "INVALID_CREDENTIALS") {
      return "Invalid email or password.";
    }

    if (typeof authError.message === "string" && authError.message.trim()) {
      return authError.message;
    }
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return fallbackMessage;
}

export async function userLogin(
  email: string,
  password: string,
  rememberMe: boolean = false,
) {
  const { data, error } = await authClient.signIn.email(
    {
      email,
      password,
      callbackURL: "/",
      rememberMe,
    },
    {
      //callbacks
    },
  );
  return { data, error };
}

export async function requestPasswordReset(email: string, redirectTo?: string) {
  const { data, error } = await authClient.requestPasswordReset({
    email,
    redirectTo,
  });

  return { data, error };
}

export async function resetPassword(newPassword: string, token: string) {
  const { data, error } = await authClient.resetPassword({
    newPassword,
    token,
  });

  return { data, error };
}

export async function requestPhonePasswordReset(phoneNumber: string) {
  const response = await api.post("/password-recovery/phone/request", {
    phoneNumber,
  });
  return response.data;
}

export async function resetPasswordByPhone(args: {
  phoneNumber: string;
  otp: string;
  newPassword: string;
}) {
  const response = await api.post("/password-recovery/phone/reset", args);
  return response.data;
}

export async function userLogout() {
  await authClient.signOut();
}
