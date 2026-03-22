import type { Metadata } from "next";
import { AboutPageStructuredData } from "@/components/seo/structured-data";

export const metadata: Metadata = {
  title: "About Us - Meet the Team Behind Reimburse AI",
  description:
    "Learn about Reimburse AI's mission to revolutionize expense management with AI and blockchain. Meet our founders Shunsuke Mark Nakatani (CEO) and Suyash Kumar Singh (CTO).",
  keywords: [
    "Reimburse AI team",
    "expense management startup",
    "AI fintech",
    "Web3 startup",
    "Shunsuke Mark Nakatani",
    "Suyash Kumar Singh",
    "blockchain expense management",
  ],
  openGraph: {
    title: "About Reimburse AI - Our Story & Team",
    description:
      "Meet the team building the future of expense management. AI-powered auditing + instant USDC payments.",
    url: "https://www.reimburseai.app/about",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "About Reimburse AI - Our Story & Team",
    description:
      "Meet the team building the future of expense management. AI-powered auditing + instant USDC payments.",
  },
  alternates: {
    canonical: "https://www.reimburseai.app/about",
  },
};

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <AboutPageStructuredData />
      {children}
    </>
  );
}
