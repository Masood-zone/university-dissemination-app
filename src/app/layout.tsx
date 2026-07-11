import type { Metadata, Viewport } from "next";
import { Geist_Mono, Inter, Lexend } from "next/font/google";
import "./globals.css";
import { Providers } from "../components/providers/providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const lexend = Lexend({
  subsets: ["latin"],
  variable: "--font-display",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "USTED IDS - Information Dissemination System",
    template: "%s | USTED IDS",
  },
  description:
    "Official USTED platform for campus announcements, academic schedules, and internal updates.",
  keywords: [
    "USTED",
    "campus",
    "announcements",
    "academic calendar",
    "timetable",
    "information",
    "dissemination",
    "student",
    "staff",
  ],
  authors: [
    {
      name: "USTED IDS",
    },
  ],
  creator: "USTED IDS",
  publisher: "USTED",
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    title: "USTED IDS - Information Dissemination System",
    description:
      "Official USTED platform for campus announcements, academic schedules, and internal updates.",
    siteName: "USTED IDS",
  },
  twitter: {
    card: "summary_large_image",
    title: "USTED IDS - Information Dissemination System",
    description:
      "Official USTED platform for campus announcements, academic schedules, and internal updates.",
  },
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
  manifest: "/site.webmanifest",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#970044" },
    { media: "(prefers-color-scheme: dark)", color: "#171317" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        {/* Prototype icon fonts */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
        />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/icon?family=Material+Icons"
        />
      </head>
      <body
        className={`${geistMono.variable} ${inter.variable} ${lexend.variable} antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
