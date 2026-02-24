interface UelloSendConfig {
  apiKey: string;
  senderId: string;
  baseUrl: string;
}

interface SendSMSOptions {
  to: string;
  message: string;
}

function getUelloBaseUrl(): string {
  return (
    process.env.UELLOSEND_API_URL ||
    process.env.UELLOSEND_BASE_URL ||
    "https://uellosend.com/quicksend/"
  );
}

class SMSService {
  private config: UelloSendConfig;

  constructor() {
    this.config = {
      apiKey: process.env.UELLOSEND_API_KEY || "",
      senderId: process.env.UELLOSEND_SENDER_ID || "",
      baseUrl: getUelloBaseUrl(),
    };
  }

  async sendSMS(options: SendSMSOptions): Promise<void> {
    if (!options.to?.trim()) throw new Error("SMS recipient is required");
    if (!options.message?.trim()) throw new Error("SMS message is required");

    if (!this.config.apiKey || !this.config.senderId) {
      throw new Error("SMS service is not configured (missing API key/sender)");
    }

    const res = await fetch(this.config.baseUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        api_key: this.config.apiKey,
        sender_id: this.config.senderId,
        recipient: options.to,
        message: options.message,
      }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`Failed to send SMS (${res.status}): ${body}`);
    }
  }

  formatPhoneNumber(phoneNumber: string): string {
    const cleaned = phoneNumber.replace(/\D/g, "");

    // Ghana default (+233). Accept: 0XXXXXXXXX, 233XXXXXXXXX
    if (cleaned.length === 10 && cleaned.startsWith("0")) {
      return `233${cleaned.substring(1)}`;
    }

    if (cleaned.length === 12 && cleaned.startsWith("233")) return cleaned;

    return cleaned;
  }

  async sendEnrollmentSubmittedSMS(args: {
    to: string;
    applicationNo: string;
    temporaryPassword?: string;
  }): Promise<void> {
    const message = args.temporaryPassword
      ? `Enrollment submitted. Application No: ${args.applicationNo}. Temporary password: ${args.temporaryPassword}. Please login and change it.`
      : `Enrollment submitted. Application No: ${args.applicationNo}.`;

    await this.sendSMS({ to: args.to, message });
  }

  async sendEnrollmentDecisionSMS(args: {
    to: string;
    applicationNo: string;
    decision: "APPROVED" | "REJECTED";
  }): Promise<void> {
    const message =
      args.decision === "APPROVED"
        ? `Enrollment approved. Application No: ${args.applicationNo}. You can now sign in to the portal.`
        : `Enrollment rejected. Application No: ${args.applicationNo}. Please check your email/portal for details.`;

    await this.sendSMS({ to: args.to, message });
  }

  async sendAnnouncementPublishedSMS(args: {
    to: string;
    title: string;
    category: string;
  }): Promise<void> {
    const message = `New announcement (${args.category}): ${args.title}. Check the portal for details.`;
    await this.sendSMS({ to: args.to, message });
  }

  async sendPasswordResetTokenSMS(args: {
    to: string;
    token: string;
    expiresIn: string;
  }): Promise<void> {
    const message = `Password reset token: ${args.token}. Expires in ${args.expiresIn}. Do not share this token.`;
    await this.sendSMS({ to: args.to, message });
  }

  async sendPasswordResetConfirmationSMS(args: { to: string }): Promise<void> {
    const message =
      "Your password has been reset successfully. If you did not request this, contact support immediately.";
    await this.sendSMS({ to: args.to, message });
  }
}

export const smsService = new SMSService();
