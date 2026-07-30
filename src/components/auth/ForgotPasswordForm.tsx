"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  requestPasswordReset,
  requestPhonePasswordReset,
} from "@/services/auth/user-auth";

export function ForgotPasswordForm() {
  const router = useRouter();
  const [channel, setChannel] = useState<"email" | "phone">("email");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [pending, setPending] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setPending(true);
    try {
      if (channel === "email") {
        const redirectTo = `${window.location.origin}/verify-otp`;
        await requestPasswordReset(email.trim(), redirectTo);
        setSubmitted(true);
        toast.success("If that email exists, recovery instructions were sent.");
      } else {
        await requestPhonePasswordReset(phone);
        sessionStorage.setItem("password-reset-phone", phone);
        toast.success("If that phone exists, a reset code was sent.");
        router.push("/reset-password?channel=phone");
      }
    } catch {
      // Use the same response to avoid exposing account existence.
      if (channel === "email") setSubmitted(true);
      else {
        sessionStorage.setItem("password-reset-phone", phone);
        router.push("/reset-password?channel=phone");
      }
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="relative z-10 mx-auto w-full max-w-md overflow-hidden rounded-2xl border border-t-4 border-t-primary bg-card shadow-2xl">
      <div className="flex flex-col items-center px-8 pb-6 pt-10 text-center">
        <Image
          alt="USTED Crest"
          className="mb-4 rounded-xl object-contain"
          src="/logo-nobg.png"
          width={96}
          height={96}
          priority
        />
        <h1 className="text-xl font-extrabold">Forgot password</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Recover your account through institutional email or phone.
        </p>
      </div>
      <div className="px-8 pb-10">
        <div className="mb-5 grid grid-cols-2 rounded-xl bg-muted p-1">
          {(["email", "phone"] as const).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => {
                setChannel(item);
                setSubmitted(false);
              }}
              className={`rounded-lg px-3 py-2 text-sm font-semibold ${
                channel === item ? "bg-background shadow-sm" : "text-muted-foreground"
              }`}
            >
              {item === "email" ? "Email" : "Phone"}
            </button>
          ))}
        </div>

        {submitted && channel === "email" ? (
          <div className="space-y-4">
            <div className="rounded-xl border bg-background p-4 text-sm">
              If an account exists for that email, a single-use reset link and
              token have been sent.
            </div>
            <Button className="w-full" variant="outline" onClick={() => setSubmitted(false)}>
              Try another email
            </Button>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <label className="block text-sm font-medium">
              {channel === "email" ? "Institutional email" : "Ghana phone number"}
              <Input
                className="mt-2"
                type={channel === "email" ? "email" : "tel"}
                autoComplete={channel === "email" ? "email" : "tel"}
                value={channel === "email" ? email : phone}
                onChange={(event) =>
                  channel === "email"
                    ? setEmail(event.target.value)
                    : setPhone(event.target.value)
                }
                placeholder={
                  channel === "email" ? "name@university.edu" : "024 000 0000"
                }
                required
              />
            </label>
            <Button type="submit" className="w-full" disabled={pending}>
              {pending
                ? "Sending…"
                : channel === "email"
                  ? "Send reset link"
                  : "Send SMS code"}
            </Button>
          </form>
        )}
        <Link
          className="mt-5 inline-block text-sm font-semibold text-primary hover:underline"
          href="/login"
        >
          Back to login
        </Link>
      </div>
      <div className="h-1.5 bg-linear-to-r from-brand-burgundy via-primary to-brand-navy" />
    </div>
  );
}
