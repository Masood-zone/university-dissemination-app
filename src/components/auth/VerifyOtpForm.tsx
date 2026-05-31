"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";

import { MaterialSymbol } from "@/components/common/MaterialSymbol";

export function VerifyOtpForm() {
  const router = useRouter();
  const search = useSearchParams();

  const tokenFromUrl = search.get("token") || "";
  const errorFromUrl = search.get("error") || "";

  const [tokenOverride, setTokenOverride] = useState<string | null>(null);
  const token = tokenOverride ?? tokenFromUrl;

  const errorMessage = useMemo(() => {
    if (!errorFromUrl) return null;
    return "This link or token is invalid or expired. Please request a new reset link.";
  }, [errorFromUrl]);

  const onContinue = () => {
    if (!token.trim()) return;
    router.push(`/reset-password?token=${encodeURIComponent(token.trim())}`);
  };

  return (
    <div className="w-full max-w-md mx-auto bg-card text-card-foreground rounded-2xl shadow-2xl border border-border overflow-hidden">
      <div className="pt-10 pb-6 px-8 flex flex-col items-center text-center">
        <div className="w-24 h-24 mb-4 relative flex items-center justify-center">
          <Image
            alt="USTED Crest"
            className="w-full h-full object-contain drop-shadow-sm rounded-xl scale-150"
            src="/logo-nobg.png"
            width={96}
            height={96}
            priority
          />
        </div>
        <h1 className="text-xl font-extrabold tracking-tight">Verify OTP</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Paste the code/token from your email to continue.
        </p>
      </div>

      <div className="px-8 pb-10 space-y-5">
        {errorMessage ? (
          <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md border border-destructive/20">
            {errorMessage}
          </div>
        ) : null}

        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="token">
            OTP / Token
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
              <MaterialSymbol icon="pin" className="text-[20px]" />
            </div>
            <input
              id="token"
              value={token}
              onChange={(e) => setTokenOverride(e.target.value)}
              className="block w-full pl-10 pr-3 py-2.5 border border-input rounded-md leading-5 bg-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:text-sm transition"
              placeholder="Paste token here"
              autoComplete="one-time-code"
            />
          </div>
        </div>

        <button
          type="button"
          onClick={onContinue}
          disabled={!token.trim()}
          className="group relative w-full flex justify-center py-2.5 px-4 border border-transparent text-sm font-semibold rounded-md text-primary-foreground bg-primary hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-60 cursor-pointer"
        >
          <span className="absolute left-0 inset-y-0 flex items-center pl-3">
            <MaterialSymbol
              icon="arrow_forward"
              className="opacity-80 group-hover:opacity-100 transition-opacity text-[20px]"
            />
          </span>
          Continue
        </button>

        <div className="flex items-center justify-between text-sm">
          <Link
            className="font-semibold text-primary hover:underline"
            href="/login"
          >
            Back to login
          </Link>
        </div>
      </div>

      <div className="h-1.5 w-full bg-linear-to-r from-primary via-primary/80 to-primary" />
    </div>
  );
}
