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
