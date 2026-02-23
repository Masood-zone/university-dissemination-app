import { authClient } from "@/lib/auth-client";

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
      rememberMe: rememberMe,
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

export async function userLogout() {
  await authClient.signOut();
}
