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

interface AnnouncementPublishedEmailProps {
  recipientEmail: string;
  recipientName?: string;
  title: string;
  category: string;
  publishedByName?: string;
  announcementUrl: string;
  summary?: string;
}

export function AnnouncementPublishedEmail({
  recipientEmail,
  recipientName,
  title,
  category,
  publishedByName,
  announcementUrl,
  summary,
}: AnnouncementPublishedEmailProps) {
  const appName = process.env.APP_NAME || "SIDS";

  return (
    <Html>
      <Head />
      <Body style={main}>
        <Container style={container}>
          <Section style={content}>
            <Text style={heading}>New announcement</Text>
            <Text style={paragraph}>
              Hello {recipientName || recipientEmail},
            </Text>

            <Section style={infoBox}>
              <Text style={label}>Title</Text>
              <Text style={value}>{title}</Text>
              <Text style={meta}>
                Category: {category}
                {publishedByName ? ` • Posted by: ${publishedByName}` : ""}
              </Text>
            </Section>

            {summary ? <Text style={paragraph}>{summary}</Text> : null}

            <Section style={buttonContainer}>
              <Button style={button} href={announcementUrl}>
                View announcement
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

const infoBox = {
  backgroundColor: "#f8f9fa",
  borderRadius: "8px",
  padding: "16px",
  margin: "20px 0",
};

const label = {
  fontSize: "12px",
  color: "#666666",
  margin: "0 0 6px",
  textTransform: "uppercase" as const,
  letterSpacing: "0.4px",
};

const value = {
  fontSize: "18px",
  fontWeight: "700",
  color: "#000000",
  margin: "0",
};

const meta = {
  fontSize: "12px",
  color: "#666666",
  margin: "10px 0 0",
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
