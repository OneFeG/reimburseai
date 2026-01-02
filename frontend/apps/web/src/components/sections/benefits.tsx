"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import {
  Building2,
  Users,
  TrendingDown,
  Clock,
  ShieldCheck,
  Smile,
  DollarSign,
  BarChart3,
  ArrowRight,
  Check,
} from "lucide-react";

const companyBenefits = [
  {
    icon: TrendingDown,
    title: "80% Cost Reduction",
    description: "Eliminate manual processing costs. AI handles what used to require entire finance teams.",
  },
  {
    icon: ShieldCheck,
    title: "Full Verification Control",
    description: "Choose AI-only autonomous mode or human review. Set daily limits and approval thresholds.",
  },
  {
    icon: Clock,
    title: "Multi-Currency Ready",
    description: "Employees submit in any currency. Auto-converted to your company's base stablecoin.",
  },
  {
    icon: BarChart3,
    title: "Complete Visibility",
    description: "Real-time dashboards and blockchain audit trails for full compliance and transparency.",
  },
];

const employeeBenefits = [
  {
    icon: Smile,
    title: "Get Paid Instantly",
    description: "No more waiting weeks for reimbursement. Approved expenses pay out in seconds.",
  },
  {
    icon: DollarSign,
    title: "USDC Payments",
    description: "Receive stable, crypto-native payments directly to your wallet. Convert anytime.",
  },
  {
    icon: Clock,
    title: "No More Paperwork",
    description: "Just snap a photo. AI handles categorization, validation, and submission.",
  },
  {
    icon: Check,
    title: "Transparent Process",
    description: "See exactly why an expense was approved or flagged. No mysterious rejections.",
  },
];

export function BenefitsSection() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section
      id="benefits"
      ref={ref}
      className="section-padding relative overflow-hidden"
    >
      {/* Background gradients */}
      <div className="absolute top-1/2 left-0 w-[500px] h-[500px] bg-cyan-400/5 rounded-full blur-3xl -translate-y-1/2 pointer-events-none" />
      <div className="absolute top-1/2 right-0 w-[500px] h-[500px] bg-purple-400/5 rounded-full blur-3xl -translate-y-1/2 pointer-events-none" />

      <div className="container-custom relative">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-center mb-16 lg:mb-20"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-400/10 border border-emerald-400/20 text-emerald-400 text-sm font-medium mb-6">
            <TrendingDown className="w-4 h-4" />
            Benefits
          </div>
          <h2 className="heading-2 mb-6">
            <span className="text-white">Built for everyone</span>
            <br />
            <span className="gradient-text">in your organization</span>
          </h2>
          <p className="text-lg text-white/50 max-w-2xl mx-auto">
            Whether you're a CFO tracking costs or an employee waiting for reimbursement,
            Reimburse AI delivers value at every level.
          </p>
        </motion.div>

        {/* Two-column benefits */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Company benefits */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 rounded-xl bg-cyan-400/10 flex items-center justify-center">
                <Building2 className="w-6 h-6 text-cyan-400" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white">For Companies</h3>
                <p className="text-white/50 text-sm">Cut costs, reduce fraud, stay compliant</p>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              {companyBenefits.map((benefit, index) => (
                <BenefitCard key={benefit.title} benefit={benefit} index={index} color="cyan" />
              ))}
            </div>
          </motion.div>

          {/* Employee benefits */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 rounded-xl bg-purple-400/10 flex items-center justify-center">
                <Users className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white">For Employees</h3>
                <p className="text-white/50 text-sm">Get paid faster, stress less</p>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              {employeeBenefits.map((benefit, index) => (
                <BenefitCard key={benefit.title} benefit={benefit} index={index} color="purple" />
              ))}
            </div>
          </motion.div>
        </div>

        {/* Stats bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="mt-16 lg:mt-24"
        >
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 p-8 rounded-2xl bg-gradient-to-r from-cyan-400/5 via-purple-400/5 to-cyan-400/5 border border-white/10">
            <StatItem value="99.7%" label="Accuracy Rate" />
            <StatItem value="< 5s" label="Processing Time" />
            <StatItem value="80%" label="Cost Savings" />
            <StatItem value="0" label="Fraudulent Payouts" />
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="mt-12 text-center"
        >
          <a
            href="#waitlist"
            className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors group"
          >
            <span>Ready to transform your expense process?</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </a>
        </motion.div>
      </div>
    </section>
  );
}

function BenefitCard({
  benefit,
  index,
  color,
}: {
  benefit: { icon: any; title: string; description: string };
  index: number;
  color: "cyan" | "purple";
}) {
  const colorClasses = {
    cyan: "border-cyan-400/20 hover:border-cyan-400/40 hover:bg-cyan-400/5",
    purple: "border-purple-400/20 hover:border-purple-400/40 hover:bg-purple-400/5",
  };

  const iconClasses = {
    cyan: "text-cyan-400 bg-cyan-400/10",
    purple: "text-purple-400 bg-purple-400/10",
  };

  return (
    <div
      className={`group flex gap-4 p-5 rounded-xl border h-[110px] ${colorClasses[color]} transition-all duration-300`}
    >
      <div
        className={`flex-shrink-0 w-10 h-10 rounded-lg ${iconClasses[color]} flex items-center justify-center`}
      >
        <benefit.icon className="w-5 h-5" />
      </div>
      <div className="flex flex-col justify-center min-w-0 flex-1 pr-2">
        <h4 className="text-white font-medium mb-1">{benefit.title}</h4>
        <p className="text-white/50 text-sm leading-relaxed">{benefit.description}</p>
      </div>
    </div>
  );
}

function StatItem({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center">
      <div className="text-3xl lg:text-4xl font-bold text-white mb-2">{value}</div>
      <div className="text-white/50 text-sm">{label}</div>
    </div>
  );
}
