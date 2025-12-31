"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import {
  Cpu,
  Blocks,
  Eye,
  Shield,
  Zap,
  Globe,
  ArrowUpRight,
} from "lucide-react";

const technologies = [
  {
    icon: Eye,
    name: "GPT-4o Vision",
    description: "State-of-the-art multimodal AI for receipt analysis and data extraction.",
    category: "AI",
    link: "https://openai.com/gpt-4",
  },
  {
    icon: Blocks,
    name: "Avalanche",
    description: "Fast, low-cost blockchain for instant USDC settlements.",
    category: "Blockchain",
    link: "https://www.avax.network/",
  },
  {
    icon: Shield,
    name: "x402 Protocol",
    description: "HTTP-native payment standard for seamless API monetization.",
    category: "Protocol",
    link: null,
  },
  {
    icon: Zap,
    name: "USDC",
    description: "Fully-backed stablecoin for reliable, dollar-pegged payments.",
    category: "Currency",
    link: "https://www.circle.com/usdc",
  },
];

export function TechnologySection() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section
      id="technology"
      ref={ref}
      className="section-padding relative overflow-hidden bg-navy-800/30"
    >
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.02]" />
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-cyan-400/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-purple-400/5 rounded-full blur-3xl pointer-events-none" />
      </div>

      <div className="container-custom relative">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Left: Content */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-400/10 border border-cyan-400/20 text-cyan-400 text-sm font-medium mb-6">
              <Cpu className="w-4 h-4" />
              Technology Stack
            </div>
            <h2 className="heading-2 mb-6">
              <span className="text-white">Powered by</span>
              <br />
              <span className="gradient-text">cutting-edge tech</span>
            </h2>
            <p className="text-lg text-white/50 mb-8">
              We combine the best in AI, blockchain, and payment protocols to create
              an expense system that's faster, cheaper, and more secure than anything
              that came before.
            </p>

            {/* Architecture diagram placeholder */}
            <div className="relative p-6 rounded-2xl border border-white/10 bg-white/[0.02]">
              <div className="grid grid-cols-3 gap-4">
                {/* Upload layer */}
                <div className="col-span-3 p-4 rounded-xl bg-cyan-400/10 border border-cyan-400/20 text-center">
                  <p className="text-cyan-400 text-sm font-medium">Receipt Upload</p>
                </div>
                
                {/* Processing layer */}
                <div className="p-4 rounded-xl bg-purple-400/10 border border-purple-400/20 text-center">
                  <p className="text-purple-400 text-xs font-medium">GPT-4o Vision</p>
                </div>
                <div className="p-4 rounded-xl bg-purple-400/10 border border-purple-400/20 text-center">
                  <p className="text-purple-400 text-xs font-medium">Policy Engine</p>
                </div>
                <div className="p-4 rounded-xl bg-purple-400/10 border border-purple-400/20 text-center">
                  <p className="text-purple-400 text-xs font-medium">Fraud Detection</p>
                </div>
                
                {/* Settlement layer */}
                <div className="col-span-3 p-4 rounded-xl bg-emerald-400/10 border border-emerald-400/20 text-center">
                  <p className="text-emerald-400 text-sm font-medium">Avalanche + USDC Settlement</p>
                </div>
              </div>
              
              {/* Flow arrows */}
              <div className="absolute left-1/2 top-[72px] -translate-x-1/2">
                <div className="w-px h-4 bg-white/20" />
              </div>
              <div className="absolute left-1/2 bottom-[72px] -translate-x-1/2">
                <div className="w-px h-4 bg-white/20" />
              </div>
            </div>
          </motion.div>

          {/* Right: Tech cards */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="grid grid-cols-1 sm:grid-cols-2 gap-4"
          >
            {technologies.map((tech, index) => (
              <TechCard key={tech.name} tech={tech} index={index} />
            ))}
          </motion.div>
        </div>

        {/* x402 Protocol highlight */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-16 lg:mt-24"
        >
          <div className="relative p-8 lg:p-12 rounded-2xl border border-cyan-400/20 bg-gradient-to-br from-cyan-400/5 to-purple-400/5 overflow-hidden">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-400/10 rounded-full blur-3xl pointer-events-none" />
            
            <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-400/10 border border-cyan-400/20 text-cyan-400 text-xs font-medium mb-4">
                  <Globe className="w-3 h-3" />
                  HTTP 402 Protocol
                </div>
                <h3 className="text-2xl lg:text-3xl font-bold text-white mb-4">
                  x402: Payment Required
                </h3>
                <p className="text-white/50 leading-relaxed mb-6">
                  We're pioneering the x402 protocol - the HTTP-native standard for 
                  machine-to-machine payments. Every AI audit request is a paid API call,
                  settled instantly in USDC. No subscriptions, no invoices, just seamless
                  pay-per-use.
                </p>
                <div className="flex flex-wrap gap-3">
                  <div className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-white/70 text-sm">
                    ERC-3009 Signatures
                  </div>
                  <div className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-white/70 text-sm">
                    Gasless for Users
                  </div>
                  <div className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-white/70 text-sm">
                    Instant Settlement
                  </div>
                </div>
              </div>
              
              {/* Code snippet */}
              <div className="relative">
                <div className="p-4 rounded-xl bg-navy-900/80 border border-white/10 font-mono text-sm overflow-x-auto">
                  <div className="text-white/40 mb-2"># x402 Payment Flow</div>
                  <div className="space-y-1">
                    <div><span className="text-cyan-400">POST</span> /api/audit</div>
                    <div className="text-white/40">→ 402 Payment Required</div>
                    <div className="text-white/40">→ Sign ERC-3009 authorization</div>
                    <div><span className="text-cyan-400">POST</span> /api/audit</div>
                    <div className="text-purple-400 pl-4">X-Payment: {"<signature>"}</div>
                    <div className="text-emerald-400">→ 200 OK + Audit Result</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function TechCard({
  tech,
  index,
}: {
  tech: (typeof technologies)[0];
  index: number;
}) {
  const Card = tech.link ? "a" : "div";
  const linkProps = tech.link
    ? { href: tech.link, target: "_blank", rel: "noopener noreferrer" }
    : {};

  return (
    <Card
      {...linkProps}
      className="group relative p-6 rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/20 transition-all duration-300"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="w-12 h-12 rounded-xl bg-cyan-400/10 flex items-center justify-center">
          <tech.icon className="w-6 h-6 text-cyan-400" />
        </div>
        {tech.link && (
          <ArrowUpRight className="w-4 h-4 text-white/30 group-hover:text-cyan-400 transition-colors" />
        )}
      </div>
      
      <div className="inline-flex px-2 py-1 rounded bg-white/5 text-white/40 text-xs mb-3">
        {tech.category}
      </div>
      
      <h4 className="text-lg font-semibold text-white mb-2">{tech.name}</h4>
      <p className="text-white/50 text-sm leading-relaxed">{tech.description}</p>
    </Card>
  );
}
