"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { forgotPasswordSchema } from "@/lib/validation";
import { MaterialSymbol } from "@/components/common/MaterialSymbol";
import { requestPasswordReset } from "@/services/auth/user-auth";

type ForgotPasswordInput = {
  email: string;
};

export function ForgotPasswordForm() {
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);

  const defaultRedirectTo = useMemo(() => {
    if (typeof window === "undefined") return undefined;
    return `${window.location.origin}/verify-otp`;
  }, []);

  const form = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema as never),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (data: ForgotPasswordInput) => {
    const { error } = await requestPasswordReset(data.email, defaultRedirectTo);

    // Avoid leaking whether an email exists.
    if (error) {
      toast.error(error.message || "Could not request password reset.");
      form.setError("root", { message: error.message });
      return;
    }

    setSubmittedEmail(data.email);
    toast.success("If that email exists, a reset link has been sent.");
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
          Forgot Password
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          We’ll send you a reset link to continue.
        </p>
      </div>

      <div className="px-8 pb-10">
        {submittedEmail ? (
          <div className="space-y-4">
            <div className="rounded-md border border-border bg-background p-4 text-sm">
              <p className="font-semibold">Check your email</p>
              <p className="mt-1 text-muted-foreground">
                If an account exists for{" "}
                <span className="font-semibold">{submittedEmail}</span>, you’ll
                receive a password reset link.
              </p>
            </div>
            <div className="flex items-center justify-between text-sm">
              <Link
                className="font-semibold text-primary hover:underline"
                href="/login"
              >
                Back to login
              </Link>
              <Link
                className="font-semibold text-primary hover:underline"
                href="/verify-otp"
              >
                I have a code/token
              </Link>
            </div>
          </div>
        ) : (
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

            <button
              className="group relative w-full flex justify-center py-2.5 px-4 border border-transparent text-sm font-semibold rounded-md text-primary-foreground bg-primary hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-60 cursor-pointer"
              type="submit"
            >
              <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                <MaterialSymbol
                  icon="send"
                  className="opacity-80 group-hover:opacity-100 transition-opacity text-[20px]"
                />
              </span>
              Send reset link
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
        )}
      </div>

      <div className="h-1.5 w-full bg-linear-to-r from-primary via-primary/80 to-primary" />
    </div>
  );
}
