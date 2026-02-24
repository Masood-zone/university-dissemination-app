import type { Metadata, Viewport } from "next";
import {
  Geist,
  Geist_Mono,
  Inter,
  Lexend,
  Nunito_Sans,
} from "next/font/google";
import "./globals.css";
import { Providers } from "../components/providers/providers";

const nunitoSans = Nunito_Sans({ variable: "--font-sans" });

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const lexend = Lexend({
  subsets: ["latin"],
  variable: "--font-lexend",
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "AAMUSTED IDS - Information Dissemination System",
    template: "%s | AAMUSTED IDS",
  },
  description:
    "Official AAMUSTED platform for campus announcements, academic schedules, and internal updates.",
  keywords: [
    "AAMUSTED",
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
      name: "AAMUSTED IDS",
    },
  ],
  creator: "AAMUSTED IDS",
  publisher: "AAMUSTED",
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
    title: "AAMUSTED IDS - Information Dissemination System",
    description:
      "Official AAMUSTED platform for campus announcements, academic schedules, and internal updates.",
    siteName: "AAMUSTED IDS",
  },
  twitter: {
    card: "summary_large_image",
    title: "AAMUSTED IDS - Information Dissemination System",
    description:
      "Official AAMUSTED platform for campus announcements, academic schedules, and internal updates.",
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
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
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
        className={`${geistSans.variable} ${geistMono.variable} ${nunitoSans.variable} ${inter.variable} ${lexend.variable} antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
