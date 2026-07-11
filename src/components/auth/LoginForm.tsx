"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginInput } from "@/lib/validation";
import Link from "next/link";

import { MaterialSymbol } from "@/components/common/MaterialSymbol";
import Image from "next/image";
import { toast } from "sonner";
import { getAuthErrorMessage, userLogin } from "@/services/auth/user-auth";
import { useState } from "react";

export function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema as never),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
  });

  const onSubmit = async (data: LoginInput) => {
    try {
      const { error } = await userLogin(
        data.email,
        data.password,
        data.rememberMe,
      );

      if (error) {
        const message = getAuthErrorMessage(
          error,
          "Invalid email or password.",
        );

        toast.error(message);
        form.setError("root", {
          message,
        });

        return;
      }

      toast.success("Login successful. Redirecting...");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Login failed. Please try again.";

      toast.error(message);
      form.setError("root", {
        message,
      });
    }
  };

  const isSubmitting = form.formState.isSubmitting;

  return (
    <div className="relative z-10 mx-auto w-full max-w-md overflow-hidden rounded-2xl border border-border border-t-4 border-t-primary bg-card text-card-foreground shadow-2xl">
      <div className="pt-10 pb-6 px-8 flex flex-col items-center text-center">
        <div className="w-24 h-24 mb-4 relative flex items-center justify-center">
          <Link href="/" className="absolute inset-0">
            <Image
              alt="USTED Crest"
              className="h-full w-full rounded-xl object-contain drop-shadow-sm"
              src="/logo-nobg.png"
              width={96}
              height={96}
              loading="eager"
            />
          </Link>
        </div>
        <h1 className="text-xl font-extrabold tracking-tight">Welcome Back</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Sign in to the Smart Information System
        </p>
      </div>

      <div className="px-8 pb-10">
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          {form.formState.errors.root && (
            <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md border border-destructive/20">
              {form.formState.errors.root.message}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="email">
              Institutional Email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
                <MaterialSymbol icon="mail" className="text-[20px]" />
              </div>
              <input
                className="block w-full pl-10 pr-3 py-2.5 border border-input rounded-md leading-5 bg-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:text-sm transition"
                id="email"
                placeholder="Enter email"
                type="email"
                {...form.register("email")}
              />
            </div>
            {form.formState.errors.email ? (
              <p className="text-xs text-destructive mt-1">
                {form.formState.errors.email.message}
              </p>
            ) : null}
          </div>

          <div>
            <label
              className="block text-sm font-medium mb-1"
              htmlFor="password"
            >
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
                <MaterialSymbol icon="lock" className="text-[20px]" />
              </div>
              <input
                className="block w-full pl-10 pr-10 py-2.5 border border-input rounded-md leading-5 bg-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:text-sm transition"
                id="password"
                placeholder="••••••••"
                type={showPassword ? "text" : "password"}
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

          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center">
              <input
                className="h-4 w-4 rounded border-input text-primary focus-visible:ring-2 focus-visible:ring-ring"
                id="rememberMe"
                type="checkbox"
                {...form.register("rememberMe")}
              />
              <label
                className="ml-2 block text-muted-foreground"
                htmlFor="rememberMe"
              >
                Remember me
              </label>
            </div>
            <div>
              <Link
                className="font-semibold text-primary hover:underline transition-colors"
                href="/forgot-password"
              >
                Forgot password?
              </Link>
            </div>
          </div>

          <div>
            <button
              className="group relative w-full flex justify-center py-2.5 px-4 border border-transparent text-sm font-semibold rounded-md text-primary-foreground bg-primary hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
              type="submit"
              disabled={isSubmitting}
              aria-busy={isSubmitting}
            >
              <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                <MaterialSymbol
                  icon={isSubmitting ? "progress_activity" : "login"}
                  className={
                    "opacity-80 group-hover:opacity-100 transition-opacity text-[20px] " +
                    (isSubmitting ? "animate-spin" : "")
                  }
                />
              </span>
              {isSubmitting ? "Logging in..." : "Log In"}
            </button>
          </div>
        </form>
      </div>

      <div className="h-1.5 w-full bg-linear-to-r from-brand-burgundy via-primary to-brand-navy" />
    </div>
  );
}
