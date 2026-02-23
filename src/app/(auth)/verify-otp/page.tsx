import { Suspense } from "react";

import { VerifyOtpForm } from "@/components/auth/VerifyOtpForm";

export const metadata = {
  title: "Verify OTP",
  description: "Verify your password reset OTP/token",
};

export default function VerifyOtpPage() {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-4 bg-background relative overflow-hidden">
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-linear-to-br from-background via-background to-muted" />
        <div className="absolute inset-0 opacity-25 dark:opacity-40 bg-[radial-gradient(circle_at_25%_25%,hsl(var(--primary))_0%,transparent_45%),radial-gradient(circle_at_80%_70%,hsl(var(--destructive))_0%,transparent_45%)]" />
      </div>

      <div className="relative z-10 w-full">
        <Suspense fallback={null}>
          <VerifyOtpForm />
        </Suspense>
      </div>

      <div className="relative z-10 mt-8 text-center text-xs text-muted-foreground">
        <p>© 2026 AAMUSTED. All rights reserved.</p>
        <p className="mt-1">Smart Information Dissemination System</p>
      </div>
    </div>
  );
}
