"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginInput } from "@/lib/validation";
import Link from "next/link";

import { MaterialSymbol } from "@/components/common/MaterialSymbol";
import Image from "next/image";
import { toast } from "sonner";
import { userLogin } from "@/services/auth/user-auth";
import { useState } from "react";

export function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
  });

  const onSubmit = async (data: LoginInput) => {
    try {
      await userLogin(data.email, data.password, data.rememberMe);
      toast.success("Login successful! Redirecting...");
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

  return (
    <div className="w-full max-w-105 mx-auto bg-white rounded-lg shadow-lg relative z-10 border border-gray-100 overflow-hidden">
      <div className="pt-10 pb-6 px-8 flex flex-col items-center text-center">
        <div className="w-24 h-24 mb-4 relative flex items-center justify-center">
          <Image
            alt="AAMUSTED Crest"
            className="w-full h-full object-contain drop-shadow-sm rounded-xl scale-150"
            src="/logo-nobg.png"
            width={96}
            height={96}
          />
        </div>
        <h1 className="text-xl font-bold text-gray-900 tracking-tight">
          Welcome Back
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Sign in to the Smart Information System
        </p>
      </div>

      <div className="px-8 pb-10">
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          {form.formState.errors.root && (
            <div className="bg-red-50 text-red-700 text-sm p-3 rounded-md border border-red-100">
              {form.formState.errors.root.message}
            </div>
          )}

          <div>
            <label
              className="block text-sm font-medium text-gray-700 mb-1"
              htmlFor="email"
            >
              Institutional Email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <MaterialSymbol icon="mail" className="text-[20px]" />
              </div>
              <input
                className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 sm:text-sm transition duration-150 ease-in-out"
                id="email"
                placeholder="Enter email"
                type="email"
                {...form.register("email")}
              />
            </div>
            {form.formState.errors.email ? (
              <p className="text-xs text-red-600 mt-1">
                {form.formState.errors.email.message}
              </p>
            ) : null}
          </div>

          <div>
            <label
              className="block text-sm font-medium text-gray-700 mb-1"
              htmlFor="password"
            >
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <MaterialSymbol icon="lock" className="text-[20px]" />
              </div>
              <input
                className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 sm:text-sm transition duration-150 ease-in-out"
                id="password"
                placeholder="••••••••"
                type={showPassword ? "text" : "password"}
                {...form.register("password")}
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 focus:outline-none"
              >
                <MaterialSymbol
                  icon={showPassword ? "visibility_off" : "visibility"}
                  className="text-[20px]"
                />
              </button>
            </div>
            {form.formState.errors.password ? (
              <p className="text-xs text-red-600 mt-1">
                {form.formState.errors.password.message}
              </p>
            ) : null}
          </div>

          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center">
              <input
                className="h-4 w-4 text-[#003399] focus:ring-blue-500 border-gray-300 rounded"
                id="rememberMe"
                type="checkbox"
                {...form.register("rememberMe")}
              />
              <label className="ml-2 block text-gray-600" htmlFor="rememberMe">
                Remember me
              </label>
            </div>
            <div>
              <Link
                className="font-medium text-[#003399] hover:text-blue-700 hover:underline transition-colors"
                href="/forgot-password"
              >
                Forgot password?
              </Link>
            </div>
          </div>

          <div>
            <button
              className="group relative w-full flex justify-center py-2.5 px-4 border border-transparent text-sm font-semibold rounded-md text-white bg-[#003399] hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-60 hover:cursor-pointer"
              type="submit"
            >
              <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                <MaterialSymbol
                  icon="login"
                  className="text-blue-300 group-hover:text-blue-200 transition-colors text-[20px]"
                />
              </span>
              Log In
            </button>
          </div>
        </form>
      </div>

      <div className="h-1.5 w-full bg-gradient-to-r from-blue-900 via-[#003399] to-blue-900" />
    </div>
  );
}
