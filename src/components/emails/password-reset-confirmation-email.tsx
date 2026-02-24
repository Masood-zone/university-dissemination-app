import {
  Body,
  Button,
  Container,
  Head,
  Hr,
  Html,
  Section,
  Text,
} from "@react-email/components";

interface PasswordResetConfirmationEmailProps {
  userEmail: string;
  userName?: string;
  signinUrl: string;
}

export function PasswordResetConfirmationEmail({
  userEmail,
  userName,
  signinUrl,
}: PasswordResetConfirmationEmailProps) {
  const appName = process.env.APP_NAME || "SIDS";

  return (
    <Html>
      <Head />
      <Body style={main}>
        <Container style={container}>
          <Section style={content}>
            <Text style={heading}>Password reset successful</Text>
            <Text style={paragraph}>Hello {userName || userEmail},</Text>
            <Text style={paragraph}>
              Your password has been successfully reset. If you didn&apos;t make
              this change, please contact support immediately.
            </Text>

            <Section style={buttonContainer}>
              <Button style={button} href={signinUrl}>
                Sign in
              </Button>
            </Section>

            <Hr style={hr} />
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
