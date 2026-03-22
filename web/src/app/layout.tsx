import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import { Providers } from "@/components/providers";
import { HomepageStructuredData } from "@/components/seo/structured-data";

export const metadata: Metadata = {
  title: {
    default: "Reimburse AI - AI-Powered Expense Management & Instant USDC Payments",
    template: "%s | Reimburse AI",
  },
  description:
    "Reimburse AI automates expense reimbursements with GPT-4o AI auditing and instant USDC crypto payments on Avalanche. Submit receipts, get paid in seconds. Free to start, $0.50 per audit.",
  keywords: [
    "Reimburse AI",
    "ReimburseAI",
    "expense management software",
    "AI expense management",
    "AI receipt scanner",
    "automated expense reports",
    "USDC payments",
    "crypto reimbursement",
    "instant reimbursement",
    "GPT-4o receipt audit",
    "x402 protocol",
    "blockchain expense management",
    "Avalanche payments",
    "expense automation",
    "AI auditing software",
    "receipt scanning AI",
    "employee reimbursement",
    "expense tracking",
  ],
  authors: [{ name: "Reimburse AI Team" }],
  creator: "Reimburse AI",
  publisher: "Reimburse AI",
  metadataBase: new URL("https://www.reimburseai.app"),
  alternates: {
    canonical: "https://www.reimburseai.app",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://www.reimburseai.app",
    siteName: "Reimburse AI",
    title: "Reimburse AI - AI-Powered Expense Management & Instant USDC Payments",
    description:
      "Submit receipts, AI verifies them, get paid in USDC instantly. Revolutionary expense management for modern companies. Free to start.",
    images: [
      {
        url: "https://www.reimburseai.app/og-image.png",
        width: 1200,
        height: 630,
        alt: "Reimburse AI - AI-Powered Expense Management",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@reimburseai",
    creator: "@reimburseai",
    title: "Reimburse AI - AI-Powered Expense Management",
    description:
      "Submit receipts → AI audits → Get paid in USDC instantly. The future of expense management.",
    images: ["https://www.reimburseai.app/og-image.png"],
  },
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
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/logo.png", sizes: "32x32", type: "image/png" },
      { url: "/logo.png", sizes: "16x16", type: "image/png" },
    ],
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
  manifest: "/site.webmanifest",
  verification: {
    // Add your verification codes here after setting up
    google: "YOUR_GOOGLE_SITE_VERIFICATION_CODE",
    // yandex: "YOUR_YANDEX_CODE",
    // bing: "YOUR_BING_CODE",
  },
  category: "Business Software",
  classification: "Business/Finance",
  other: {
    "msapplication-TileColor": "#0A0A0F",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "black-translucent",
    "apple-mobile-web-app-title": "Reimburse AI",
    "application-name": "Reimburse AI",
    "mobile-web-app-capable": "yes",
  },
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
        <head>
        {/* Structured Data for Google Rich Results & LLMs */}
        <HomepageStructuredData />
        
        {/* Preconnect to external services for performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        
        {/* DNS Prefetch for APIs */}
        <link rel="dns-prefetch" href="https://api.reimburseai.app" />
        <link rel="dns-prefetch" href="https://api.thirdweb.com" />
      </head>
      <body
        className={`${GeistSans.variable} ${GeistMono.variable} font-sans bg-navy-950 text-white min-h-screen`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
