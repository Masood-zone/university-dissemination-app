import { emailService } from "@/lib/email-service";
import { smsService } from "@/lib/sms-service";

function getAppUrl(): string {
  return (
    process.env.APP_URL ||
    process.env.BETTER_AUTH_URL ||
    process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/?$/, "") ||
    "http://localhost:3000"
  );
}

export async function notifyDepartmentStaffWelcome(args: {
  recipientName: string;
  departmentName: string;
  role: "ADMIN" | "DEPARTMENT_ADMIN" | "LECTURER" | "STUDENT";
  email: string;
  phone: string;
  password: string;
}): Promise<void> {
  const roleLabel =
    args.role === "ADMIN"
      ? "Super Admin"
      : args.role === "DEPARTMENT_ADMIN"
        ? "Department Administrator"
        : args.role === "LECTURER"
          ? "Lecturer"
          : "Student";
  const loginUrl = `${getAppUrl()}/login`;
  const phone = smsService.formatPhoneNumber(args.phone);

  await Promise.allSettled([
    emailService
      .sendDepartmentStaffWelcomeEmail({
        to: args.email,
        recipientName: args.recipientName,
        roleLabel,
        departmentName: args.departmentName,
        email: args.email,
        password: args.password,
        loginUrl,
      })
      .catch((error) => {
        console.error("Failed to send department staff welcome email:", error);
      }),
    smsService
      .sendDepartmentStaffWelcomeSMS({
        to: phone,
        recipientName: args.recipientName,
        roleLabel,
        departmentName: args.departmentName,
        email: args.email,
        password: args.password,
        loginUrl,
      })
      .catch((error) => {
        console.error("Failed to send department staff welcome SMS:", error);
      }),
  ]);
}
