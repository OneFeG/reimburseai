"use client";

import { useRef } from "react";
import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, Play, Sparkles, Zap, Shield, DollarSign } from "lucide-react";
import { HeroBackground } from "./hero-background";

export function HeroSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], [0, 200]);
  // Only fade the upper content, keep stats visible longer on mobile
  const opacity = useTransform(scrollYProgress, [0, 0.3, 0.5], [1, 1, 0]);
  // Stats should remain visible longer
  const statsOpacity = useTransform(scrollYProgress, [0, 0.6, 0.8], [1, 1, 0]);

  return (
    <section
      ref={containerRef}
      className="relative min-h-screen flex items-center justify-center pt-24 pb-20 overflow-hidden"
    >
      {/* Background */}
      <HeroBackground />

      <motion.div
        style={{ y, opacity }}
        className="container-custom relative z-10"
      >
        <div className="max-w-5xl mx-auto text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm mb-8"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-400" />
            </span>
            <span className="text-sm text-white/70">
              Now in Private Beta
            </span>
            <span className="text-cyan-400 text-sm font-medium">
              Join the Waitlist →
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="heading-1 mb-6"
          >
            <span className="gradient-text-white">Expense Management</span>
            <br />
            <span className="text-white">
              Powered by{" "}
              <span className="relative">
                <span className="gradient-text">AI & Crypto</span>
                <svg
                  className="absolute -bottom-2 left-0 w-full"
                  viewBox="0 0 200 8"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M1 5.5C47.6667 2.16667 141.4 -1.9 199 5.5"
                    stroke="url(#gradient)"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <defs>
                    <linearGradient id="gradient" x1="0" y1="0" x2="200" y2="0">
                      <stop stopColor="#22D3EE" />
                      <stop offset="1" stopColor="#06B6D4" />
                    </linearGradient>
                  </defs>
                </svg>
              </span>
            </span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg md:text-xl text-white/50 max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            Upload receipts, let GPT-4o validate expenses against your policy, and get 
            instant USDC payouts. Zero manual reviews. Zero delayed reimbursements.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
          >
            <Link
              href="#waitlist"
              className="group relative inline-flex items-center gap-2 px-8 py-4 text-base font-semibold text-black bg-cyan-400 rounded-xl overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-cyan-400/25 hover:scale-105"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-300 via-cyan-400 to-cyan-500 animate-gradient bg-[length:200%_100%]" />
              <span className="relative flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                Join the Waitlist
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </span>
            </Link>

            <Link
              href="/demo"
              className="group inline-flex items-center gap-3 px-8 py-4 text-base font-medium text-white bg-white/5 border border-white/10 rounded-xl backdrop-blur-sm transition-all duration-300 hover:bg-white/10 hover:border-white/20"
            >
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-cyan-400/20 transition-colors">
                <Play className="w-3 h-3 ml-0.5" />
              </div>
              Try Demo
            </Link>
          </motion.div>

          {/* Stats - Using separate opacity to stay visible longer on mobile */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            style={{ opacity: statsOpacity }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-3xl mx-auto relative z-20"
          >
            <Stat
              icon={<Zap className="w-5 h-5 text-cyan-400" />}
              value="< 5s"
              label="Average Processing Time"
            />
            <Stat
              icon={<Shield className="w-5 h-5 text-cyan-400" />}
              value="99.7%"
              label="Fraud Detection Rate"
            />
            <Stat
              icon={<DollarSign className="w-5 h-5 text-cyan-400" />}
              value="$0.50"
              label="Per Receipt Audit Cost"
            />
          </motion.div>
        </div>

        {/* Floating elements */}
        <motion.div
          animate={{
            y: [0, -20, 0],
            rotate: [0, 5, 0],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute top-32 left-[5%] w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-400/10 to-transparent border border-cyan-400/10 backdrop-blur-sm hidden xl:block"
        />
        <motion.div
          animate={{
            y: [0, 20, 0],
            rotate: [0, -5, 0],
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute top-48 right-[5%] w-12 h-12 rounded-xl bg-gradient-to-br from-purple-400/10 to-transparent border border-purple-400/10 backdrop-blur-sm hidden xl:block"
        />
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="w-6 h-10 rounded-full border-2 border-white/20 flex items-start justify-center p-2"
        >
          <motion.div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
        </motion.div>
      </motion.div>
    </section>
  );
}

function Stat({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
}) {
  return (
    <div className="text-center p-4 rounded-2xl bg-navy-900/50 backdrop-blur-sm border border-white/5">
      <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-cyan-400/10 border border-cyan-400/20 mb-3">
        {icon}
      </div>
      <div className="text-3xl font-bold text-white mb-1">{value}</div>
      <div className="text-sm text-white/60">{label}</div>
    </div>
  );
}
