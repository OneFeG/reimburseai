"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import {
  Brain,
  Zap,
  Shield,
  Wallet,
  Clock,
  FileCheck,
  ArrowRight,
} from "lucide-react";

const features = [
  {
    icon: Brain,
    title: "AI-Powered Auditing",
    description:
      "GPT-4o Vision analyzes every receipt in seconds. Extracts vendor, amount, date, and validates against your expense policy automatically.",
    color: "cyan",
    stats: "99.7% accuracy",
  },
  {
    icon: Zap,
    title: "Instant USDC Payouts",
    description:
      "Approved expenses are paid out instantly in USDC on Avalanche. No more waiting for payroll cycles or bank transfers.",
    color: "purple",
    stats: "< 5 second settlement",
  },
  {
    icon: Shield,
    title: "Fraud Prevention",
    description:
      "Advanced AI detects duplicate receipts, altered amounts, and policy violations before they cost you money.",
    color: "emerald",
    stats: "Zero false approvals",
  },
  {
    icon: FileCheck,
    title: "Policy Enforcement",
    description:
      "Set spending limits, approved categories, and vendor restrictions. AI ensures 100% compliance automatically.",
    color: "orange",
    stats: "Custom policies",
  },
  {
    icon: Clock,
    title: "Real-Time Processing",
    description:
      "Upload a receipt, get audited, receive payment - all in under 10 seconds. No human bottlenecks.",
    color: "pink",
    stats: "10x faster",
  },
  {
    icon: Wallet,
    title: "Web3 Native",
    description:
      "Built on blockchain for transparency. Every transaction is verifiable on-chain. Your employees get crypto-native wallets.",
    color: "blue",
    stats: "On-chain audit trail",
  },
];

export function FeaturesSection() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section
      id="features"
      ref={ref}
      className="section-padding relative overflow-hidden"
    >
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-400/5 to-transparent pointer-events-none" />

      <div className="container-custom relative">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-center mb-16 lg:mb-20"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-400/10 border border-cyan-400/20 text-cyan-400 text-sm font-medium mb-6">
            <Zap className="w-4 h-4" />
            Powerful Features
          </div>
          <h2 className="heading-2 mb-6">
            <span className="text-white">Everything you need to</span>
            <br />
            <span className="gradient-text">automate expenses</span>
          </h2>
          <p className="text-lg text-white/50 max-w-2xl mx-auto">
            From receipt upload to crypto payout, we handle the entire reimbursement
            workflow with AI precision and blockchain speed.
          </p>
        </motion.div>

        {/* Features grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <FeatureCard
              key={feature.title}
              feature={feature}
              index={index}
              isInView={isInView}
            />
          ))}
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="mt-16 text-center"
        >
          <a
            href="#how-it-works"
            className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors group"
          >
            <span>See how it works</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </a>
        </motion.div>
      </div>
    </section>
  );
}

function FeatureCard({
  feature,
  index,
  isInView,
}: {
  feature: (typeof features)[0];
  index: number;
  isInView: boolean;
}) {
  const colorClasses = {
    cyan: "from-cyan-400/20 to-cyan-400/0 border-cyan-400/20 group-hover:border-cyan-400/40",
    purple: "from-purple-400/20 to-purple-400/0 border-purple-400/20 group-hover:border-purple-400/40",
    emerald: "from-emerald-400/20 to-emerald-400/0 border-emerald-400/20 group-hover:border-emerald-400/40",
    orange: "from-orange-400/20 to-orange-400/0 border-orange-400/20 group-hover:border-orange-400/40",
    pink: "from-pink-400/20 to-pink-400/0 border-pink-400/20 group-hover:border-pink-400/40",
    blue: "from-blue-400/20 to-blue-400/0 border-blue-400/20 group-hover:border-blue-400/40",
  };

  const iconColorClasses = {
    cyan: "text-cyan-400 bg-cyan-400/10",
    purple: "text-purple-400 bg-purple-400/10",
    emerald: "text-emerald-400 bg-emerald-400/10",
    orange: "text-orange-400 bg-orange-400/10",
    pink: "text-pink-400 bg-pink-400/10",
    blue: "text-blue-400 bg-blue-400/10",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="group relative"
    >
      <div
        className={`relative h-full p-8 rounded-2xl bg-gradient-to-b ${
          colorClasses[feature.color as keyof typeof colorClasses]
        } border backdrop-blur-sm transition-all duration-300 hover:translate-y-[-4px]`}
      >
        {/* Icon */}
        <div
          className={`w-14 h-14 rounded-xl ${
            iconColorClasses[feature.color as keyof typeof iconColorClasses]
          } flex items-center justify-center mb-6 transition-transform duration-300 group-hover:scale-110`}
        >
          <feature.icon className="w-7 h-7" />
        </div>

        {/* Content */}
        <h3 className="text-xl font-semibold text-white mb-3">
          {feature.title}
        </h3>
        <p className="text-white/50 leading-relaxed mb-4">
          {feature.description}
        </p>

        {/* Stats badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-sm text-white/70">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
          {feature.stats}
        </div>

        {/* Hover glow */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
      </div>
    </motion.div>
  );
}
