import {
  Body,
  Button,
  Container,
  Head,
  Hr,
  Html,
  Link,
  Section,
  Text,
} from "@react-email/components";

interface ForgotPasswordEmailProps {
  userEmail: string;
  userName?: string;
  resetUrl: string;
  token: string;
  expiresIn: string;
}

export function ForgotPasswordEmail({
  userEmail,
  userName,
  resetUrl,
  token,
  expiresIn,
}: ForgotPasswordEmailProps) {
  const appName = process.env.APP_NAME || "SIDS";

  return (
    <Html>
      <Head />
      <Body style={main}>
        <Container style={container}>
          <Section style={content}>
            <Text style={heading}>Reset your password</Text>
            <Text style={paragraph}>Hello {userName || userEmail},</Text>

            <Text style={paragraph}>
              We received a request to reset your password for your {appName}
              account. If you didn&apos;t make this request, you can safely
              ignore this email.
            </Text>

            <Section style={tokenSection}>
              <Text style={tokenLabel}>Your verification token:</Text>
              <Text style={tokenCode}>{token}</Text>
              <Text style={tokenExpiry}>This token expires in {expiresIn}</Text>
            </Section>

            <Text style={paragraph}>
              You can also click the button below to reset your password
              directly:
            </Text>

            <Section style={buttonContainer}>
              <Button style={button} href={resetUrl}>
                Reset Password
              </Button>
            </Section>

            <Text style={paragraph}>
              Or copy and paste this link into your browser:
            </Text>

            <Link href={resetUrl} style={link}>
              {resetUrl}
            </Link>

            <Hr style={hr} />

            <Text style={footer}>
              For security reasons, this link will expire in {expiresIn}.
            </Text>

            <Text style={footer}>
              Best regards,
              <br />
              {appName}
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const main = {
  backgroundColor: "#f6f9fc",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "20px 0 48px",
  marginBottom: "64px",
};

const content = {
  padding: "0 48px",
};

const heading = {
  fontSize: "28px",
  lineHeight: "1.3",
  fontWeight: "700",
  color: "#484848",
  textAlign: "center" as const,
  margin: "24px 0 24px",
};

const paragraph = {
  fontSize: "16px",
  lineHeight: "1.4",
  color: "#484848",
  margin: "16px 0",
};

const tokenSection = {
  backgroundColor: "#f8f9fa",
  borderRadius: "8px",
  padding: "20px",
  textAlign: "center" as const,
  margin: "24px 0",
};

const tokenLabel = {
  fontSize: "14px",
  color: "#666666",
  margin: "0 0 8px",
};

const tokenCode = {
  fontSize: "20px",
  fontWeight: "700",
  color: "#000000",
  letterSpacing: "1px",
  margin: "0 0 8px",
  fontFamily: "monospace",
  wordBreak: "break-all" as const,
};

const tokenExpiry = {
  fontSize: "12px",
  color: "#999999",
  margin: "0",
};

const buttonContainer = {
  textAlign: "center" as const,
  margin: "24px 0",
};

const button = {
  backgroundColor: "#000000",
  borderRadius: "6px",
  color: "#ffffff",
  fontSize: "16px",
  fontWeight: "600",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "12px 24px",
};

const link = {
  color: "#067df7",
  textDecoration: "underline",
  fontSize: "14px",
  wordBreak: "break-all" as const,
};

const hr = {
  borderColor: "#e6ebf1",
  margin: "28px 0",
};

const footer = {
  color: "#8898aa",
  fontSize: "12px",
  lineHeight: "1.4",
  margin: "12px 0 0",
};
