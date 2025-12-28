"use client";

import { Logo } from "@/components/brand/logo";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Zap, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";

export default function LandingPage() {
    return (
        <div className="min-h-screen bg-black text-white flex flex-col">
            {/* Navbar */}
            <nav className="h-16 border-b border-[#333] flex items-center justify-between px-6 lg:px-12 backdrop-blur-md bg-black/50 sticky top-0 z-50">
                <Logo />
                <div className="flex items-center gap-4">
                    <Link
                        href="/sign-in"
                        className="text-sm text-gray-400 hover:text-white transition-colors"
                    >
                        Sign In
                    </Link>
                    <Link
                        href="/sign-up"
                        className="text-sm bg-[#22D3EE] text-black font-medium px-4 py-2 rounded-md hover:bg-[#22D3EE]/90 transition-colors"
                    >
                        Get Started
                    </Link>
                </div>
            </nav>

            {/* Hero Section */}
            <main className="flex-1 flex flex-col items-center justify-center text-center px-4 py-20 relative overflow-hidden">
                {/* Background Gradients */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-[#22D3EE]/10 blur-[100px] rounded-full pointer-events-none" />

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="relative z-10 max-w-4xl mx-auto"
                >
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#333] bg-[#111] text-xs text-gray-400 mb-8">
                        <span className="w-2 h-2 rounded-full bg-[#22D3EE] animate-pulse" />
                        Reimburse AI 2.0 is now live
                    </div>

                    <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-b from-white to-gray-500">
                        Expense management <br />
                        <span className="text-white">on autopilot.</span>
                    </h1>

                    <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
                        AI-powered auditing, instant crypto settlement, and zero-friction reimbursements.
                        Stop chasing receipts and start automating finance.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link
                            href="/dashboard"
                            className="h-12 px-8 rounded-md bg-[#22D3EE] text-black font-medium flex items-center gap-2 hover:bg-[#22D3EE]/90 transition-all active:scale-95"
                        >
                            Start Demo <ArrowRight className="w-4 h-4" />
                        </Link>
                        <Link
                            href="#"
                            className="h-12 px-8 rounded-md border border-[#333] bg-[#111] text-white font-medium flex items-center gap-2 hover:bg-[#222] transition-all active:scale-95"
                        >
                            Contact Sales
                        </Link>
                    </div>
                </motion.div>

                {/* Features Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto mt-32 px-4">
                    <FeatureCard
                        icon={<Zap className="w-6 h-6 text-[#22D3EE]" />}
                        title="Instant Settlement"
                        description="Payouts in seconds via USDC. No more waiting for payroll cycles."
                    />
                    <FeatureCard
                        icon={<ShieldCheck className="w-6 h-6 text-[#22D3EE]" />}
                        title="AI Auditing"
                        description="Smart contracts and AI verify every receipt against your policy."
                    />
                    <FeatureCard
                        icon={<CheckCircle2 className="w-6 h-6 text-[#22D3EE]" />}
                        title="Zero Fraud"
                        description="Cryptographic proof and AI analysis eliminate duplicate or fake receipts."
                    />
                </div>
            </main>

            {/* Footer */}
            <footer className="border-t border-[#333] py-8 text-center text-gray-500 text-sm">
                <p>© 2025 Reimburse AI. All rights reserved.</p>
            </footer>
        </div>
    );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
    return (
        <div className="p-6 rounded-xl border border-[#333] bg-[#0A0A0A] hover:border-[#22D3EE]/50 transition-colors text-left group">
            <div className="mb-4 p-3 rounded-lg bg-[#111] w-fit group-hover:bg-[#22D3EE]/10 transition-colors">
                {icon}
            </div>
            <h3 className="text-xl font-semibold mb-2 text-white">{title}</h3>
            <p className="text-gray-400 leading-relaxed">{description}</p>
        </div>
    );
}
