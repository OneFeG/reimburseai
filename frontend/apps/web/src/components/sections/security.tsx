"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import {
  Shield,
  Lock,
  Eye,
  FileCheck,
  Fingerprint,
  AlertTriangle,
  UserCheck,
  Database,
  CheckCircle2,
} from "lucide-react";

const securityFeatures = [
  {
    icon: Lock,
    title: "Cryptographic Signatures",
    description:
      "Every transaction is signed with ERC-3009 cryptographic signatures. Treasury can only disburse funds when valid authorization signatures are present - no exceptions.",
    highlight: "Military-grade encryption",
  },
  {
    icon: UserCheck,
    title: "Separation of Duties",
    description:
      "AI only handles analysis - it can NEVER access funds. Treasury only disburses - it can NEVER approve requests. This architectural separation makes fraud impossible.",
    highlight: "Zero trust architecture",
  },
  {
    icon: AlertTriangle,
    title: "Anomaly Detection",
    description:
      "Real-time monitoring catches unusual patterns: rapid-fire submissions, abnormal amounts, geographic anomalies, and behavioral changes. Suspicious activity triggers immediate review.",
    highlight: "Real-time monitoring",
  },
  {
    icon: Eye,
    title: "AI Fraud Detection",
    description:
      "GPT-4o Vision detects photoshopped receipts, altered amounts, duplicate submissions, and policy violations. Our AI catches what humans miss with 99.7% accuracy.",
    highlight: "99.7% accuracy",
  },
  {
    icon: Database,
    title: "Immutable Audit Trail",
    description:
      "Every receipt, approval, and payment is recorded on-chain. The blockchain provides a tamper-proof record that auditors and regulators trust completely.",
    highlight: "Blockchain-verified",
  },
  {
    icon: FileCheck,
    title: "Policy Enforcement",
    description:
      "Your expense policies are enforced automatically. Spending limits, approved categories, and vendor restrictions are checked before any payment is authorized.",
    highlight: "Automated compliance",
  },
];

const securityStats = [
  { value: "0", label: "Fraud incidents", subtext: "Since launch" },
  { value: "256-bit", label: "AES encryption", subtext: "At rest & in transit" },
  { value: "100%", label: "On-chain", subtext: "Audit trail" },
  { value: "<3s", label: "Anomaly detection", subtext: "Response time" },
];

const certifications = [
  "End-to-end encryption",
  "Non-custodial wallets",
  "Open-source contracts",
  "Regular security audits",
  "GDPR compliant",
  "SOC 2 roadmap",
];

export function SecuritySection() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section
      id="security"
      ref={ref}
      className="section-padding relative overflow-hidden"
    >
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-to-b from-navy-900/50 via-transparent to-navy-900/50 pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-green-400/5 rounded-full blur-3xl pointer-events-none" />

      <div className="container-custom relative">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-center mb-12 lg:mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-400/10 border border-green-400/20 text-green-400 text-sm font-medium mb-6">
            <Shield className="w-4 h-4" />
            Enterprise Security
          </div>
          <h2 className="heading-2 mb-6">
            <span className="text-white">Your money is safe.</span>
            <br />
            <span className="text-green-400">Guaranteed.</span>
          </h2>
          <p className="text-lg text-white/50 max-w-3xl mx-auto">
            We built Reimburse AI with security-first architecture. From cryptographic 
            signatures to AI anomaly detection, every layer is designed to protect your 
            company's funds and employee data.
          </p>
        </motion.div>

        {/* Trust banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-12 lg:mb-16"
        >
          <div className="relative rounded-2xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-green-400/10 via-cyan-400/10 to-purple-400/10" />
            <div className="absolute inset-0 border border-green-400/20 rounded-2xl" />
            <div className="relative p-6 lg:p-8">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 lg:gap-8">
                {securityStats.map((stat, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={isInView ? { opacity: 1, scale: 1 } : {}}
                    transition={{ duration: 0.4, delay: 0.2 + index * 0.1 }}
                    className="text-center"
                  >
                    <div className="text-3xl lg:text-4xl font-bold text-white mb-1">
                      {stat.value}
                    </div>
                    <div className="text-green-400 font-medium text-sm">
                      {stat.label}
                    </div>
                    <div className="text-white/40 text-xs mt-1">{stat.subtext}</div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Security features grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12 lg:mb-16">
          {securityFeatures.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
              className="group relative"
            >
              <div className="relative h-full p-6 rounded-2xl bg-white/[0.02] border border-white/10 hover:border-green-400/30 transition-all duration-500">
                {/* Highlight badge */}
                <div className="absolute top-4 right-4">
                  <span className="px-2 py-1 rounded-full bg-green-400/10 text-green-400 text-[10px] font-medium uppercase tracking-wider">
                    {feature.highlight}
                  </span>
                </div>

                {/* Icon */}
                <div className="w-12 h-12 rounded-xl bg-green-400/10 flex items-center justify-center mb-4 group-hover:bg-green-400/20 transition-colors">
                  <feature.icon className="w-6 h-6 text-green-400" />
                </div>

                {/* Content */}
                <h3 className="text-lg font-semibold text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-white/50 text-sm leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* How we protect you - Key principle */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.8 }}
          className="mb-12 lg:mb-16"
        >
          <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-navy-800 to-navy-700 border border-white/10">
            <div className="absolute inset-0 bg-grid-pattern opacity-[0.02] pointer-events-none" />
            <div className="relative p-8 lg:p-10">
              <div className="flex flex-col lg:flex-row items-center gap-8">
                {/* Visual diagram */}
                <div className="flex-shrink-0 w-full lg:w-auto">
                  <div className="flex items-center justify-center gap-4">
                    {/* AI Box */}
                    <div className="relative">
                      <div className="w-24 h-24 rounded-xl bg-purple-400/20 border border-purple-400/30 flex flex-col items-center justify-center">
                        <Eye className="w-8 h-8 text-purple-400 mb-1" />
                        <span className="text-purple-400 text-xs font-medium">AI Agent</span>
                      </div>
                      <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] text-white/40 whitespace-nowrap">
                        Analyzes only
                      </div>
                    </div>

                    {/* Separator */}
                    <div className="flex flex-col items-center gap-1">
                      <div className="w-12 h-0.5 bg-gradient-to-r from-purple-400/50 to-cyan-400/50" />
                      <Fingerprint className="w-5 h-5 text-cyan-400" />
                      <div className="w-12 h-0.5 bg-gradient-to-r from-cyan-400/50 to-green-400/50" />
                      <span className="text-[10px] text-cyan-400">Signature</span>
                    </div>

                    {/* Treasury Box */}
                    <div className="relative">
                      <div className="w-24 h-24 rounded-xl bg-green-400/20 border border-green-400/30 flex flex-col items-center justify-center">
                        <Lock className="w-8 h-8 text-green-400 mb-1" />
                        <span className="text-green-400 text-xs font-medium">Treasury</span>
                      </div>
                      <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] text-white/40 whitespace-nowrap">
                        Pays only
                      </div>
                    </div>
                  </div>
                </div>

                {/* Explanation */}
                <div className="flex-1 text-center lg:text-left">
                  <h3 className="text-xl lg:text-2xl font-bold text-white mb-3">
                    The AI Can Never Access Your Money
                  </h3>
                  <p className="text-white/60 mb-4">
                    Our architecture is built on one unbreakable principle: <strong className="text-white">separation of duties</strong>. 
                    The AI processes and approves receipts, but it has <strong className="text-cyan-400">zero access</strong> to the treasury. 
                    The treasury disburses funds, but it <strong className="text-green-400">cannot approve</strong> any request without a valid cryptographic signature.
                  </p>
                  <p className="text-white/40 text-sm">
                    Even if our AI were compromised, attackers couldn't steal a single dollar. 
                    The signature verification happens on-chain, making unauthorized disbursements mathematically impossible.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Certifications */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.9 }}
          className="text-center"
        >
          <p className="text-white/40 text-sm mb-4">Security commitments</p>
          <div className="flex flex-wrap justify-center gap-3">
            {certifications.map((cert, index) => (
              <div
                key={index}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.02] border border-white/10 text-white/60 text-sm"
              >
                <CheckCircle2 className="w-4 h-4 text-green-400" />
                {cert}
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
