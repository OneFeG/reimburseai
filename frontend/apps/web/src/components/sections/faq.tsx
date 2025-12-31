"use client";

import { useRef, useState } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { HelpCircle, Plus, Minus } from "lucide-react";

const faqs = [
  {
    question: "How does the AI receipt auditing work?",
    answer:
      "Our system uses GPT-4o Vision to analyze receipt images. It extracts vendor name, amount, date, and line items, then validates them against your company's expense policy. The entire process takes under 5 seconds and achieves 99.7% accuracy.",
  },
  {
    question: "What blockchain do you use for payments?",
    answer:
      "We use Avalanche C-Chain for all USDC settlements. Avalanche offers sub-second finality, low transaction costs, and is fully EVM-compatible. Your employees receive USDC, a fully-backed stablecoin pegged to the US dollar.",
  },
  {
    question: "How do employees receive their reimbursements?",
    answer:
      "Employees connect their crypto wallet (or we create a custodial wallet for them). When an expense is approved, USDC is transferred directly to their wallet within seconds. They can hold the USDC or convert it to fiat through any exchange.",
  },
  {
    question: "What is the x402 protocol?",
    answer:
      "x402 is an HTTP-native payment protocol based on the 402 'Payment Required' status code. It enables pay-per-use API calls where each AI audit request is paid for in USDC using ERC-3009 signatures. This means no subscriptions, no invoices - just seamless micropayments.",
  },
  {
    question: "How do you prevent fraud?",
    answer:
      "Our AI checks for duplicate receipts, altered amounts, Photoshop artifacts, and policy violations. We maintain a hash of every processed receipt to prevent resubmission. All transactions are recorded on-chain for a tamper-proof audit trail.",
  },
  {
    question: "What currencies do you support?",
    answer:
      "All payments are made in USDC on Avalanche. USDC is a stablecoin backed 1:1 by US dollars, so there's no crypto volatility. We're exploring support for additional stablecoins like EURC for European companies.",
  },
  {
    question: "How much does Reimburse.ai cost?",
    answer:
      "We charge $0.05 per receipt processed. No monthly fees, no per-seat pricing, no minimums. You only pay for what you use. Early waitlist members get founding pricing with additional discounts.",
  },
  {
    question: "Can I customize expense policies?",
    answer:
      "Absolutely. You can set spending limits per category, define approved expense types, restrict vendors, set receipt requirements, and configure approval workflows. The AI enforces your policies automatically.",
  },
  {
    question: "Is my data secure?",
    answer:
      "Receipt images are encrypted at rest and in transit. We process images for data extraction and immediately delete them. We never train AI models on your data. All sensitive information is stored with AES-256 encryption.",
  },
  {
    question: "How do I get started?",
    answer:
      "Join our waitlist to get early access. Once approved, you'll complete a simple onboarding: set up your company, invite employees, configure policies, and fund your USDC wallet. Most companies are live within an hour.",
  },
];

export function FAQSection() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section
      id="faq"
      ref={ref}
      className="section-padding relative overflow-hidden bg-navy-800/30"
    >
      {/* Background */}
      <div className="absolute inset-0 bg-grid-pattern opacity-[0.02] pointer-events-none" />

      <div className="container-custom relative">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-center mb-12 lg:mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-400/10 border border-purple-400/20 text-purple-400 text-sm font-medium mb-6">
            <HelpCircle className="w-4 h-4" />
            FAQ
          </div>
          <h2 className="heading-2 mb-6">
            <span className="text-white">Frequently asked</span>
            <br />
            <span className="gradient-text">questions</span>
          </h2>
          <p className="text-lg text-white/50 max-w-2xl mx-auto">
            Everything you need to know about Reimburse.ai.
            Can't find what you're looking for?{" "}
            <a
              href="mailto:contact@reimburseai.app"
              className="text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              Contact us
            </a>
          </p>
        </motion.div>

        {/* FAQ accordion */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="max-w-3xl mx-auto"
        >
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <FAQItem
                key={index}
                question={faq.question}
                answer={faq.answer}
                isOpen={openIndex === index}
                onToggle={() => setOpenIndex(openIndex === index ? null : index)}
                index={index}
              />
            ))}
          </div>
        </motion.div>

        {/* Contact CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-12 lg:mt-16 text-center"
        >
          <div className="inline-flex flex-col sm:flex-row items-center gap-4 p-6 rounded-2xl bg-gradient-to-r from-purple-400/10 to-cyan-400/10 border border-white/10">
            <div className="text-center sm:text-left">
              <p className="text-white font-medium mb-1">Still have questions?</p>
              <p className="text-white/50 text-sm">
                We're here to help you get started
              </p>
            </div>
            <a
              href="mailto:contact@reimburseai.app"
              className="btn-secondary whitespace-nowrap"
            >
              Contact Us
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function FAQItem({
  question,
  answer,
  isOpen,
  onToggle,
  index,
}: {
  question: string;
  answer: string;
  isOpen: boolean;
  onToggle: () => void;
  index: number;
}) {
  return (
    <div
      className={`rounded-xl border transition-all duration-300 ${
        isOpen
          ? "bg-white/[0.03] border-cyan-400/30"
          : "bg-white/[0.01] border-white/10 hover:border-white/20"
      }`}
    >
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-6 text-left"
        suppressHydrationWarning
      >
        <span className="text-white font-medium pr-4">{question}</span>
        <div
          className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
            isOpen ? "bg-cyan-400/20 text-cyan-400" : "bg-white/5 text-white/50"
          }`}
        >
          {isOpen ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
        </div>
      </button>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="px-6 pb-6">
              <p className="text-white/50 leading-relaxed">{answer}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
