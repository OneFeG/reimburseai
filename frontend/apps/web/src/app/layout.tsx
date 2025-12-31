import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import { Providers } from "@/components/providers";

export const metadata: Metadata = {
  title: {
    default: "Reimburse AI - AI-Powered Expense Management",
    template: "%s | Reimburse AI",
  },
  description:
    "Revolutionary expense management powered by AI auditing and instant crypto settlements. Automate your reimbursements with GPT-4o vision and USDC payouts.",
  keywords: [
    "expense management",
    "AI auditing",
    "receipt scanning",
    "USDC payments",
    "crypto reimbursement",
    "automated expenses",
    "GPT-4o",
    "x402 protocol",
    "blockchain payments",
  ],
  authors: [{ name: "Reimburse AI" }],
  creator: "Reimburse AI",
  publisher: "Reimburse AI",
  metadataBase: new URL("https://reimburseai.app"),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://reimburseai.app",
    siteName: "Reimburse AI",
    title: "Reimburse AI - AI-Powered Expense Management",
    description:
      "Revolutionary expense management powered by AI auditing and instant crypto settlements.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Reimburse AI",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Reimburse AI - AI-Powered Expense Management",
    description:
      "Revolutionary expense management powered by AI auditing and instant crypto settlements.",
    images: ["/og-image.png"],
    creator: "@reimburseai",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: "/logo.png", sizes: "32x32", type: "image/png" },
      { url: "/logo.png", sizes: "16x16", type: "image/png" },
    ],
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
  manifest: "/site.webmanifest",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#0A0A0F" },
    { media: "(prefers-color-scheme: dark)", color: "#0A0A0F" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${GeistSans.variable} ${GeistMono.variable} font-sans bg-navy-950 text-white min-h-screen`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
