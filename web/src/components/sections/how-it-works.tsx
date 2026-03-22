"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Upload, Brain, CheckCircle, Wallet, ArrowRight } from "lucide-react";

const steps = [
  {
    step: "01",
    icon: Upload,
    title: "Upload Receipt",
    description:
      "Employee snaps a photo of their receipt in any currency and uploads it through the app. Supports all formats.",
    details: ["Any currency supported", "Auto-rotate and enhance", "Batch uploads supported"],
  },
  {
    step: "02",
    icon: Brain,
    title: "AI Analysis",
    description:
      "Our AI extracts all data from the receipt, converts currency, and validates against your company's policy.",
    details: ["Vendor identification", "Auto currency conversion", "Policy compliance check"],
  },
  {
    step: "03",
    icon: CheckCircle,
    title: "Verification",
    description:
      "Based on your settings: auto-approve compliant expenses or route for human review. Full control.",
    details: ["Autonomous or human review", "Smart flagging system", "Audit trail generation"],
  },
  {
    step: "04",
    icon: Wallet,
    title: "Instant Payout",
    description:
      "Approved amount is transferred directly to the employee's wallet in your company's base stablecoin.",
    details: ["Instant settlement", "Multi-currency to stablecoin", "On-chain verification"],
  },
];

export function HowItWorksSection() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section
      id="how-it-works"
      ref={ref}
      className="section-padding relative overflow-hidden bg-navy-800/30"
    >
      {/* Background pattern */}
      <div className="absolute inset-0 bg-grid-pattern opacity-[0.02] pointer-events-none" />
      
      {/* Gradient overlays */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-cyan-400/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-400/10 rounded-full blur-3xl pointer-events-none" />

      <div className="container-custom relative">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-center mb-16 lg:mb-24"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-400/10 border border-purple-400/20 text-purple-400 text-sm font-medium mb-6">
            <ArrowRight className="w-4 h-4" />
            Simple Process
          </div>
          <h2 className="heading-2 mb-6">
            <span className="text-white">From receipt to reimbursement</span>
            <br />
            <span className="gradient-text">in under 10 seconds</span>
          </h2>
          <p className="text-lg text-white/50 max-w-2xl mx-auto">
            Our streamlined process eliminates manual data entry, approval delays, and
            payment wait times. Just upload and get paid.
          </p>
        </motion.div>

        {/* Timeline */}
        <div className="relative">
          {/* Connection line */}
          <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent -translate-y-1/2" />

          {/* Steps */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <StepCard
                key={step.step}
                step={step}
                index={index}
                isInView={isInView}
              />
            ))}
          </div>
        </div>

        {/* Demo CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="mt-16 lg:mt-24 text-center"
        >
          <div className="inline-flex flex-col sm:flex-row items-center gap-4 p-6 rounded-2xl bg-gradient-to-r from-cyan-400/10 to-purple-400/10 border border-white/10">
            <div className="text-center sm:text-left">
              <p className="text-white font-medium mb-1">
                Want to see it in action?
              </p>
              <p className="text-white/50 text-sm">
                Try our demo mode with simulated data
              </p>
            </div>
            <a
              href="/demo"
              className="btn-primary whitespace-nowrap"
            >
              Try Demo Mode
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function StepCard({
  step,
  index,
  isInView,
}: {
  step: (typeof steps)[0];
  index: number;
  isInView: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay: index * 0.15 }}
      className="relative group"
    >
      {/* Step number badge */}
      <div className="relative z-10 w-16 h-16 mx-auto mb-6 rounded-full bg-navy-900 border-2 border-cyan-400/30 flex items-center justify-center group-hover:border-cyan-400 transition-colors duration-300">
        <span className="text-cyan-400 font-mono font-bold text-lg">
          {step.step}
        </span>
        
        {/* Glow effect */}
        <div className="absolute inset-0 rounded-full bg-cyan-400/20 blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>

      {/* Card content */}
      <div className="text-center">
        {/* Icon */}
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-white/5 text-white/70 mb-4 group-hover:bg-cyan-400/10 group-hover:text-cyan-400 transition-all duration-300">
          <step.icon className="w-6 h-6" />
        </div>

        {/* Title */}
        <h3 className="text-xl font-semibold text-white mb-3">{step.title}</h3>

        {/* Description */}
        <p className="text-white/50 text-sm leading-relaxed mb-6">
          {step.description}
        </p>

        {/* Details list */}
        <ul className="space-y-2 pt-2">
          {step.details.map((detail) => (
            <li
              key={detail}
              className="flex items-center justify-center gap-2 text-sm text-white/40"
            >
              <span className="w-1 h-1 rounded-full bg-cyan-400" />
              {detail}
            </li>
          ))}
        </ul>
      </div>

      {/* Arrow connector (visible on lg) */}
      {index < steps.length - 1 && (
        <div className="hidden lg:block absolute top-8 -right-4 text-cyan-400/30">
          <ArrowRight className="w-6 h-6" />
        </div>
      )}
    </motion.div>
  );
}
