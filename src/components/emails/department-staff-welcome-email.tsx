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

interface DepartmentStaffWelcomeEmailProps {
  recipientName: string;
  departmentName: string;
  roleLabel: string;
  loginUrl: string;
  email: string;
  password: string;
}

export function DepartmentStaffWelcomeEmail({
  recipientName,
  departmentName,
  roleLabel,
  loginUrl,
  email,
  password,
}: DepartmentStaffWelcomeEmailProps) {
  const appName = process.env.APP_NAME || "SIDS";

  return (
    <Html>
      <Head />
      <Body style={main}>
        <Container style={shell}>
          <Section style={topStrip} />

          <Section style={content}>
            <Text style={eyebrow}>Account created</Text>
            <Text style={heading}>Welcome to {appName}</Text>
            <Text style={paragraph}>Hello {recipientName},</Text>
            <Text style={paragraph}>
              Your {roleLabel.toLowerCase()} account for {departmentName} is
              ready. Use the credentials below to sign in for the first time.
            </Text>

            <Section style={credentialGrid}>
              <Section style={credentialCard}>
                <Text style={credentialLabel}>Email</Text>
                <Text style={credentialValue}>{email}</Text>
              </Section>

              <Section style={credentialCard}>
                <Text style={credentialLabel}>Temporary password</Text>
                <Text style={credentialValue}>{password}</Text>
              </Section>
            </Section>

            <Section style={summaryCard}>
              <Text style={summaryTitle}>What to do next</Text>
              <Text style={summaryText}>
                Sign in, confirm your account details, and change your password
                immediately after your first login.
              </Text>
            </Section>

            <Section style={buttonContainer}>
              <Button style={button} href={loginUrl}>
                Sign in now
              </Button>
            </Section>

            <Hr style={hr} />
            <Text style={footer}>
              If you were not expecting this account, please contact your
              department administrator.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const main = {
  backgroundColor: "#f4f7fb",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif',
};

const shell = {
  backgroundColor: "#ffffff",
  borderRadius: "18px",
  margin: "0 auto",
  overflow: "hidden",
  padding: "0 0 32px",
  marginBottom: "40px",
};

const topStrip = {
  background: "linear-gradient(90deg, #0f172a 0%, #2563eb 55%, #14b8a6 100%)",
  height: "12px",
};

const content = {
  padding: "32px 40px 0",
};

const eyebrow = {
  color: "#2563eb",
  fontSize: "12px",
  fontWeight: "700",
  letterSpacing: "0.16em",
  margin: "0 0 8px",
  textTransform: "uppercase" as const,
};

const heading = {
  color: "#0f172a",
  fontSize: "30px",
  fontWeight: "800",
  lineHeight: "1.2",
  margin: "0 0 18px",
};

const paragraph = {
  color: "#334155",
  fontSize: "16px",
  lineHeight: "1.6",
  margin: "0 0 14px",
};

const credentialGrid = {
  margin: "24px 0 0",
};

const credentialCard = {
  backgroundColor: "#f8fafc",
  border: "1px solid #e2e8f0",
  borderRadius: "14px",
  padding: "16px 18px",
  margin: "0 0 14px",
};

const credentialLabel = {
  color: "#64748b",
  fontSize: "12px",
  fontWeight: "700",
  letterSpacing: "0.08em",
  margin: "0 0 6px",
  textTransform: "uppercase" as const,
};

const credentialValue = {
  color: "#0f172a",
  fontSize: "16px",
  fontWeight: "700",
  margin: "0",
  wordBreak: "break-word" as const,
};

const summaryCard = {
  backgroundColor: "#eff6ff",
  border: "1px solid #bfdbfe",
  borderRadius: "14px",
  margin: "8px 0 0",
  padding: "18px",
};

const summaryTitle = {
  color: "#1d4ed8",
  fontSize: "14px",
  fontWeight: "800",
  margin: "0 0 8px",
  textTransform: "uppercase" as const,
  letterSpacing: "0.06em",
};

const summaryText = {
  color: "#1e293b",
  fontSize: "15px",
  lineHeight: "1.6",
  margin: "0",
};

const buttonContainer = {
  textAlign: "center" as const,
  margin: "28px 0 8px",
};

const button = {
  backgroundColor: "#0f172a",
  borderRadius: "9999px",
  color: "#ffffff",
  display: "inline-block",
  fontSize: "15px",
  fontWeight: "700",
  padding: "14px 28px",
  textDecoration: "none",
};

const hr = {
  borderColor: "#e2e8f0",
  margin: "28px 0 18px",
};

const footer = {
  color: "#64748b",
  fontSize: "12px",
  lineHeight: "1.6",
  margin: "0",
};