import { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Us | ReimburseAI - AI-Powered Expense Management",
  description:
    "Learn about ReimburseAI - the team revolutionizing expense management with AI verification and instant USDC crypto payments. Meet our founders and discover our mission.",
  keywords: [
    "ReimburseAI team",
    "AI expense management",
    "crypto reimbursement",
    "startup founders",
    "Web3 fintech",
    "instant payments",
    "USDC payments",
    "Avalanche blockchain",
  ],
  openGraph: {
    title: "About Us | ReimburseAI",
    description:
      "Meet the team building the future of expense management with AI and instant crypto payments.",
    type: "website",
    url: "https://reimburseai.app/about",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "ReimburseAI - About Us",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "About Us | ReimburseAI",
    description:
      "Meet the team building the future of expense management with AI and instant crypto payments.",
    images: ["/og-image.png"],
  },
};

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
