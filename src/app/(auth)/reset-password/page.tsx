import { Suspense } from "react";

import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";

export const metadata = {
  title: "Reset Password",
  description: "Set a new password",
};

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-4 bg-background relative overflow-hidden">
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-linear-to-br from-background via-background to-muted" />
        <div className="absolute inset-0 opacity-25 dark:opacity-40 bg-[radial-gradient(circle_at_25%_25%,var(--brand-gold)_0%,transparent_45%),radial-gradient(circle_at_80%_70%,var(--brand-navy)_0%,transparent_45%)]" />
      </div>

      <div className="relative z-10 w-full">
        <Suspense fallback={null}>
          <ResetPasswordForm />
        </Suspense>
      </div>

      <div className="relative z-10 mt-8 text-center text-xs text-muted-foreground">
        <p>© 2026 USTED. All rights reserved.</p>
        <p className="mt-1">Smart Information Dissemination System</p>
      </div>
    </div>
  );
}
