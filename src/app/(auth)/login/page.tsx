import { LoginForm } from "@/components/auth/LoginForm";

export const metadata = {
  title: "Login",
  description: "Sign in to AAMUSTED Information Dissemination System",
};

export default function LoginPage() {
  return (
    <div className="prototype-font-inter min-h-screen flex flex-col justify-center items-center p-4 bg-[#f3f4f6] relative">
      <div
        className="fixed inset-0 z-0 pointer-events-none opacity-40"
        style={{
          backgroundImage:
            "radial-gradient(circle at center, #e5e7eb 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />

      <div className="relative z-10 w-full">
        <LoginForm />
      </div>

      <div className="relative z-10 mt-8 text-center text-xs text-gray-400">
        <p>© 2026 AAMUSTED. All rights reserved.</p>
        <p className="mt-1">Smart Information Dissemination System</p>
      </div>
    </div>
  );
}
