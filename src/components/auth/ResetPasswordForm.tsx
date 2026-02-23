"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { resetPasswordSchema } from "@/lib/validation";
import { MaterialSymbol } from "@/components/common/MaterialSymbol";
import { resetPassword } from "@/services/auth/user-auth";

type ResetPasswordInput = {
  token: string;
  password: string;
  confirmPassword: string;
};

export function ResetPasswordForm() {
  const router = useRouter();
  const search = useSearchParams();

  const tokenFromUrl = search.get("token") || "";
  const errorFromUrl = search.get("error") || "";

  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema as never),
    defaultValues: {
      token: tokenFromUrl,
      password: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    if (tokenFromUrl) {
      form.setValue("token", tokenFromUrl);
    }
  }, [tokenFromUrl, form]);

  const onSubmit = async (data: ResetPasswordInput) => {
    const { error } = await resetPassword(data.password, data.token);

    if (error) {
      toast.error(error.message || "Password reset failed.");
      form.setError("root", { message: error.message });
      return;
    }

    toast.success("Password updated. You can now log in.");
    router.push("/login");
  };

  return (
    <div className="w-full max-w-md mx-auto bg-card text-card-foreground rounded-2xl shadow-2xl border border-border overflow-hidden">
      <div className="pt-10 pb-6 px-8 flex flex-col items-center text-center">
        <div className="w-24 h-24 mb-4 relative flex items-center justify-center">
          <Image
            alt="AAMUSTED Crest"
            className="w-full h-full object-contain drop-shadow-sm rounded-xl scale-150"
            src="/logo-nobg.png"
            width={96}
            height={96}
            priority
          />
        </div>
        <h1 className="text-xl font-extrabold tracking-tight">
          Reset Password
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Set a new password for your account.
        </p>
      </div>

      <div className="px-8 pb-10">
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          {errorFromUrl ? (
            <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md border border-destructive/20">
              This link or token is invalid or expired. Please request a new
              reset link.
            </div>
          ) : null}

          {form.formState.errors.root && (
            <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md border border-destructive/20">
              {form.formState.errors.root.message}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="token">
              Token
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
                <MaterialSymbol icon="pin" className="text-[20px]" />
              </div>
              <input
                id="token"
                className="block w-full pl-10 pr-3 py-2.5 border border-input rounded-md leading-5 bg-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:text-sm transition"
                placeholder="Token from email"
                {...form.register("token")}
              />
            </div>
            {form.formState.errors.token ? (
              <p className="text-xs text-destructive mt-1">
                {form.formState.errors.token.message}
              </p>
            ) : null}
          </div>

          <div>
            <label
              className="block text-sm font-medium mb-1"
              htmlFor="password"
            >
              New password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
                <MaterialSymbol icon="lock" className="text-[20px]" />
              </div>
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                className="block w-full pl-10 pr-10 py-2.5 border border-input rounded-md leading-5 bg-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:text-sm transition"
                placeholder="••••••••"
                {...form.register("password")}
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground focus:outline-none"
              >
                <MaterialSymbol
                  icon={showPassword ? "visibility_off" : "visibility"}
                  className="text-[20px]"
                />
              </button>
            </div>
            {form.formState.errors.password ? (
              <p className="text-xs text-destructive mt-1">
                {form.formState.errors.password.message}
              </p>
            ) : null}
          </div>

          <div>
            <label
              className="block text-sm font-medium mb-1"
              htmlFor="confirmPassword"
            >
              Confirm password
            </label>
            <input
              id="confirmPassword"
              type={showPassword ? "text" : "password"}
              className="block w-full px-3 py-2.5 border border-input rounded-md leading-5 bg-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:text-sm transition"
              placeholder="••••••••"
              {...form.register("confirmPassword")}
            />
            {form.formState.errors.confirmPassword ? (
              <p className="text-xs text-destructive mt-1">
                {form.formState.errors.confirmPassword.message}
              </p>
            ) : null}
          </div>

          <button
            className="group relative w-full flex justify-center py-2.5 px-4 border border-transparent text-sm font-semibold rounded-md text-primary-foreground bg-primary hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-60 cursor-pointer"
            type="submit"
          >
            <span className="absolute left-0 inset-y-0 flex items-center pl-3">
              <MaterialSymbol
                icon="check"
                className="opacity-80 group-hover:opacity-100 transition-opacity text-[20px]"
              />
            </span>
            Update password
          </button>

          <div className="flex items-center justify-between text-sm">
            <Link
              className="font-semibold text-primary hover:underline"
              href="/login"
            >
              Back to login
            </Link>
          </div>
        </form>
      </div>

      <div className="h-1.5 w-full bg-linear-to-r from-primary via-primary/80 to-primary" />
    </div>
  );
}
