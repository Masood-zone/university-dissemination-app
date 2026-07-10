import { LoginForm } from "@/components/auth/LoginForm";

export const metadata = {
  title: "Login",
  description: "Sign in to USTED Information Dissemination System",
};

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-4 bg-background relative overflow-hidden">
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-linear-to-br from-background via-background to-muted" />
        <div className="absolute inset-0 opacity-25 dark:opacity-40 bg-[radial-gradient(circle_at_25%_25%,var(--brand-gold)_0%,transparent_45%),radial-gradient(circle_at_80%_70%,var(--brand-navy)_0%,transparent_45%)]" />
      </div>

      <div className="relative z-10 w-full">
        <LoginForm />
      </div>

      <div className="relative z-10 mt-8 text-center text-xs text-muted-foreground">
        <p>© 2026 USTED. All rights reserved.</p>
        <p className="mt-1">Smart Information Dissemination System</p>
      </div>
    </div>
  );
}
