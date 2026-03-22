"use client";

import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { HeroSection } from "@/components/sections/hero";
import { FeaturesSection } from "@/components/sections/features";
import { HowItWorksSection } from "@/components/sections/how-it-works";
import { BenefitsSection } from "@/components/sections/benefits";
import { TechnologySection } from "@/components/sections/technology";
import { SecuritySection } from "@/components/sections/security";
import { WaitlistSection } from "@/components/sections/waitlist";
import { FAQSection } from "@/components/sections/faq";

export default function HomePage() {
  return (
    <main className="relative overflow-hidden">
      {/* Background effects */}
      <div className="fixed inset-0 bg-navy-950 -z-10" />
      <div className="fixed inset-0 bg-grid -z-10 opacity-30" />
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-cyan-400/5 blur-[150px] rounded-full -z-10" />
      <div className="fixed bottom-0 right-0 w-[600px] h-[600px] bg-purple-500/5 blur-[150px] rounded-full -z-10" />
      
      <Header />
      <HeroSection />
      <FeaturesSection />
      <HowItWorksSection />
      <BenefitsSection />
      <TechnologySection />
      <SecuritySection />
      <WaitlistSection />
      <FAQSection />
      <Footer />
    </main>
  );
}
