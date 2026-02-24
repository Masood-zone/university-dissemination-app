import nodemailer from "nodemailer";
import { render } from "@react-email/render";
import { createElement, type ReactElement } from "react";

import { ForgotPasswordEmail } from "@/components/emails/forgot-password-email";
import { PasswordResetConfirmationEmail } from "@/components/emails/password-reset-confirmation-email";
import { StudentEnrollmentSubmittedEmail } from "@/components/emails/student-enrollment-submitted-email";
import { StudentEnrollmentDecisionEmail } from "@/components/emails/student-enrollment-decision-email";
import { AnnouncementPublishedEmail } from "@/components/emails/announcement-published-email";

interface EmailConfig {
  service?: string;
  host?: string;
  port?: number;
  secure?: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

function parseBoolean(value: string | undefined): boolean | undefined {
  if (value === undefined) return undefined;
  return value.toLowerCase() === "true";
}

function getAppUrl(): string {
  return (
    process.env.APP_URL ||
    process.env.BETTER_AUTH_URL ||
    process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/?$/, "") ||
    "http://localhost:3000"
  );
}

function buildTransportConfig(): EmailConfig {
  const user = process.env.SMTP_USER || "";
  const pass = process.env.SMTP_PASS || "";

  const serviceEnv = process.env.SMTP_SERVICE;
  const hostEnv = process.env.SMTP_HOST;
  const portEnv = process.env.SMTP_PORT;
  const secureEnv = parseBoolean(process.env.SMTP_SECURE);

  const port = portEnv ? Number(portEnv) : undefined;

  const hostLooksLikeService =
    !!hostEnv && !hostEnv.includes(".") && hostEnv !== "localhost";

  const service = serviceEnv || (hostLooksLikeService ? hostEnv : undefined);
  const host = service ? undefined : hostEnv;

  return {
    ...(service ? { service } : {}),
    ...(host ? { host } : {}),
    ...(port !== undefined ? { port } : {}),
    ...(secureEnv !== undefined ? { secure: secureEnv } : {}),
    auth: { user, pass },
  };
}

class EmailService {
  private transporter: nodemailer.Transporter;
  private readonly from: string;

  constructor() {
    const config = buildTransportConfig();

    this.from = process.env.SMTP_FROM || config.auth.user;

    this.transporter = nodemailer.createTransport({
      ...config,
      auth: config.auth.user && config.auth.pass ? config.auth : undefined,
    });
  }

  async sendEmail(options: SendEmailOptions): Promise<void> {
    const { to, subject, html, text } = options;

    if (!to?.trim()) throw new Error("Email recipient is required");
    if (!subject?.trim()) throw new Error("Email subject is required");
    if (!html?.trim()) throw new Error("Email html is required");

    await this.transporter.sendMail({
      from: this.from,
      to,
      subject,
      html,
      text,
    });
  }

  async sendReactEmail(args: {
    to: string;
    subject: string;
    component: ReactElement;
    text?: string;
  }): Promise<void> {
    const html = await render(args.component);
    await this.sendEmail({
      to: args.to,
      subject: args.subject,
      html,
      text: args.text,
    });
  }

  async verifyConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      return true;
    } catch {
      return false;
    }
  }

  // ---------------------------------------------------------------------------
  // Use-cases
  // ---------------------------------------------------------------------------

  async sendForgotPasswordEmail(args: {
    userEmail: string;
    userName?: string;
    resetUrl: string;
    token: string;
    expiresIn: string;
  }): Promise<void> {
    await this.sendReactEmail({
      to: args.userEmail,
      subject: `Reset Your Password - ${process.env.APP_NAME || "SIDS"}`,
      component: createElement(ForgotPasswordEmail, {
        userEmail: args.userEmail,
        userName: args.userName,
        resetUrl: args.resetUrl,
        token: args.token,
        expiresIn: args.expiresIn,
      }),
      text: `Reset your password using this link: ${args.resetUrl} or use token: ${args.token} (expires in ${args.expiresIn}).`,
    });
  }

  async sendPasswordResetConfirmationEmail(args: {
    userEmail: string;
    userName?: string;
  }): Promise<void> {
    await this.sendReactEmail({
      to: args.userEmail,
      subject: `Password Reset Successful - ${process.env.APP_NAME || "SIDS"}`,
      component: createElement(PasswordResetConfirmationEmail, {
        userEmail: args.userEmail,
        userName: args.userName,
        signinUrl: `${getAppUrl()}/login`,
      }),
      text: "Your password has been successfully reset.",
    });
  }

  async sendStudentEnrollmentSubmittedEmail(args: {
    to: string;
    studentName?: string;
    applicationNo: string;
    temporaryPassword?: string;
    portalUrl?: string;
  }): Promise<void> {
    const portalUrl = args.portalUrl || `${getAppUrl()}/login`;

    await this.sendReactEmail({
      to: args.to,
      subject: `Enrollment Submitted - ${process.env.APP_NAME || "SIDS"}`,
      component: createElement(StudentEnrollmentSubmittedEmail, {
        studentEmail: args.to,
        studentName: args.studentName,
        applicationNo: args.applicationNo,
        portalUrl,
        temporaryPassword: args.temporaryPassword,
      }),
      text: `Your enrollment has been submitted. Application No: ${args.applicationNo}. Portal: ${portalUrl}`,
    });
  }

  async sendStudentEnrollmentDecisionEmail(args: {
    to: string;
    studentName?: string;
    applicationNo: string;
    decision: "APPROVED" | "REJECTED";
    reason?: string;
    portalUrl?: string;
  }): Promise<void> {
    const portalUrl = args.portalUrl || `${getAppUrl()}/login`;

    await this.sendReactEmail({
      to: args.to,
      subject: `Enrollment ${args.decision} - ${process.env.APP_NAME || "SIDS"}`,
      component: createElement(StudentEnrollmentDecisionEmail, {
        studentEmail: args.to,
        studentName: args.studentName,
        applicationNo: args.applicationNo,
        decision: args.decision,
        reason: args.reason,
        portalUrl,
      }),
      text:
        args.decision === "APPROVED"
          ? `Congratulations! Your enrollment has been approved. Application No: ${args.applicationNo}. Login: ${portalUrl}`
          : `Your enrollment was rejected. Application No: ${args.applicationNo}. ${args.reason ? `Reason: ${args.reason}` : ""}`,
    });
  }

  async sendAnnouncementPublishedEmail(args: {
    to: string;
    recipientName?: string;
    title: string;
    category: string;
    publishedByName?: string;
    announcementUrl?: string;
    summary?: string;
  }): Promise<void> {
    const announcementUrl = args.announcementUrl || `${getAppUrl()}`;

    await this.sendReactEmail({
      to: args.to,
      subject: `New Announcement: ${args.title}`,
      component: createElement(AnnouncementPublishedEmail, {
        recipientEmail: args.to,
        recipientName: args.recipientName,
        title: args.title,
        category: args.category,
        publishedByName: args.publishedByName,
        announcementUrl,
        summary: args.summary,
      }),
      text: `New announcement (${args.category}): ${args.title}. View: ${announcementUrl}`,
    });
  }
}

export const emailService = new EmailService();
