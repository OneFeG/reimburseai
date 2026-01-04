"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { 
  Rocket, 
  Zap, 
  Users, 
  Target, 
  Globe, 
  Sparkles,
  Twitter,
  Linkedin,
  Github,
  GraduationCap,
  Building2,
  MapPin,
  ArrowRight,
  Mail,
  MessageCircle,
  Clock,
  DollarSign,
  Receipt
} from "lucide-react";
import Link from "next/link";

// Team members data
const founders = [
  {
    name: "Shunsuke Mark Nakatani",
    role: "Co-Founder & CEO",
    image: "/team/mark.jpg",
    bio: "A dynamic young entrepreneur and visionary leader driving innovation at the intersection of Web3 and Artificial Intelligence. As Co-Founder and CEO, he spearheads the company's strategic direction, product vision, and growth.",
    details: [
      { icon: MapPin, text: "Japan / University of Washington" },
      { icon: GraduationCap, text: "VP, UW Blockchain Society" },
    ],
    social: {
      twitter: "https://x.com/Mark_Nakatani",
      linkedin: "https://www.linkedin.com/in/shunsuke-nakatani-770176373/",
    },
  },
  {
    name: "Suyash Kumar Singh",
    role: "Co-Founder & CTO",
    image: "/team/suyash.jpg",
    bio: "A visionary technologist and entrepreneur passionate about harnessing cutting-edge technology to solve real-world challenges. He leads the technical vision and development, building innovative products at the intersection of AI, Web3, and Blockchain.",
    details: [
      { icon: MapPin, text: "India / IIT Guwahati" },
      { icon: Building2, text: "Technical Lead" },
    ],
    social: {
      twitter: "https://x.com/blinderchief_",
      linkedin: "https://www.linkedin.com/in/suyash-kumar-singh/",
    },
  },
];

const teamMembers = [
  {
    name: "Juan Felipe Gaviria Giraldo",
    role: "",
    image: "/team/juan.jpg",
    bio: "Born in Colombia, Juan brings a unique dual background in Systems Engineering and International Business. With over 2 years of experience delivering complex projects, he specializes in the intersection of AI and Blockchain.",
    details: [
      { icon: MapPin, text: "Colombia" },
      { icon: GraduationCap, text: "Systems Engineering & International Business" },
    ],
    social: {
      twitter: "https://x.com/JuanFeG07",
      linkedin: "https://www.linkedin.com/in/juan-felipe-gaviria-giraldo-4ab54224a",
    },
  },
];

const values = [
  {
    icon: Zap,
    title: "Speed First",
    description: "We believe reimbursements should be instant. Days of waiting for money you've already spent is unacceptable in 2025.",
  },
  {
    icon: Target,
    title: "Solve Real Problems",
    description: "We don't build features for the sake of it. Every line of code addresses genuine pain points for companies and employees.",
  },
  {
    icon: Users,
    title: "People-Centric",
    description: "Technology should serve people, not the other way around. We automate the tedious so humans can focus on what matters.",
  },
  {
    icon: Globe,
    title: "Borderless by Design",
    description: "Remote teams, global companies, instant international payments. We're building for the future of work.",
  },
];

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

export default function AboutPage() {
  return (
    <main className="relative overflow-hidden">
      {/* Background effects */}
      <div className="fixed inset-0 bg-navy-950 -z-10" />
      <div className="fixed inset-0 bg-grid -z-10 opacity-30" />
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-cyan-400/5 blur-[150px] rounded-full -z-10" />
      <div className="fixed bottom-0 right-0 w-[600px] h-[600px] bg-purple-500/5 blur-[150px] rounded-full -z-10" />

      <Header />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-4xl mx-auto text-center"
          >
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm mb-8">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span className="text-sm text-white/70">Our Story</span>
            </div>

            <h1 className="heading-1 mb-6">
              <span className="gradient-text-white">Making Money Move</span>
              <br />
              <span className="gradient-text">As Fast As Ideas</span>
            </h1>

            <p className="text-lg md:text-xl text-white/50 max-w-3xl mx-auto leading-relaxed">
              We're building the future where expense reimbursements finally match the speed 
              at which modern teams work. No more waiting weeks for money you've already spent.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Story Section */}
      <section className="relative py-20">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="max-w-4xl mx-auto"
          >
            <div className="glass rounded-3xl p-8 md:p-12">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-cyan-400/10 border border-cyan-400/20 flex items-center justify-center">
                  <Rocket className="w-6 h-6 text-cyan-400" />
                </div>
                <h2 className="heading-3 text-white">The Problem We Saw</h2>
              </div>

              <div className="space-y-6 text-white/70 leading-relaxed">
                <p>
                  In our daily work, everything is <span className="text-cyan-400 font-medium">instant</span>: 
                  We spin up servers across the globe in seconds, deploy code with a single command, 
                  and collaborate in real time across time zones.
                </p>

                <p>
                  Yet when it came to something as basic as a $50 cloud bill or a team dinner receipt, 
                  the process felt stuck in the stone age: Scan the receipt, fill out endless forms, 
                  chase approvals, and wait weeks for a bank transfer that might arrive... eventually.
                </p>

                <p className="text-white/90 text-lg border-l-2 border-cyan-400 pl-6 my-8">
                  It was absurd. We were building in the 21st century, but our financial infrastructure 
                  was still running on 20th-century rails.
                </p>

                <p>
                  "Modern" expense tools? They just digitized the same slow, manual nightmare — 
                  fancier forms, same delays, same frustration. We didn't want a slightly faster 
                  version of the old process. We wanted the pain to <span className="text-cyan-400 font-medium">disappear entirely</span>.
                </p>
              </div>
            </div>

            {/* Solution Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="mt-8 glass rounded-3xl p-8 md:p-12 border-cyan-400/20"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-cyan-400/10 border border-cyan-400/20 flex items-center justify-center">
                  <Zap className="w-6 h-6 text-cyan-400" />
                </div>
                <h2 className="heading-3 text-white">Our Solution: Pay-to-Go</h2>
              </div>

              <div className="space-y-6 text-white/70 leading-relaxed">
                <p>
                  That's when it clicked: The real breakthrough isn't better software — it's 
                  <span className="text-cyan-400 font-medium"> automating the actual money movement</span>.
                </p>

                <p>
                  By combining powerful <span className="text-white">AI (GPT-4o Vision)</span> for instant, 
                  accurate receipt verification with <span className="text-white">blockchain-powered instant payments</span> in 
                  USDC on Avalanche, we eliminated waiting periods completely.
                </p>

                <div className="grid md:grid-cols-3 gap-4 my-8">
                  <div className="bg-white/5 rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-cyan-400 mb-1">99.7%</div>
                    <div className="text-sm text-white/50">Audit Accuracy</div>
                  </div>
                  <div className="bg-white/5 rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-cyan-400 mb-1">&lt; 5s</div>
                    <div className="text-sm text-white/50">To Get Paid</div>
                  </div>
                  <div className="bg-white/5 rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-cyan-400 mb-1">80%</div>
                    <div className="text-sm text-white/50">Cost Savings</div>
                  </div>
                </div>

                <p>
                  Receipts get snapped, AI audits in seconds, approvals happen automatically 
                  (or with human oversight if needed), and funds land in your wallet in under 5 seconds — 
                  no paperwork, no delays, no excuses.
                </p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Values Section */}
      <section className="relative py-20">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="heading-2 mb-4">
              <span className="gradient-text-white">Our Values</span>
            </h2>
            <p className="text-white/50 max-w-2xl mx-auto">
              The principles that guide everything we build
            </p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            className="grid md:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {values.map((value, index) => (
              <motion.div
                key={value.title}
                variants={fadeInUp}
                className="card-hover group"
              >
                <div className="w-12 h-12 rounded-xl bg-cyan-400/10 border border-cyan-400/20 flex items-center justify-center mb-4 group-hover:bg-cyan-400/20 transition-colors">
                  <value.icon className="w-6 h-6 text-cyan-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{value.title}</h3>
                <p className="text-sm text-white/50">{value.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Team Section */}
      <section className="relative py-20">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="heading-2 mb-4">
              <span className="gradient-text-white">Meet the Team</span>
            </h2>
            <p className="text-white/50 max-w-2xl mx-auto">
              The people building the future of expense management
            </p>
          </motion.div>

          {/* Founders */}
          <motion.div
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            className="grid md:grid-cols-2 gap-8 mb-12"
          >
            {founders.map((member, index) => (
              <motion.div
                key={member.name}
                variants={fadeInUp}
                className="glass rounded-3xl p-8 group hover:border-cyan-400/20 transition-all duration-300"
              >
                <div className="flex flex-col sm:flex-row gap-6">
                  {/* Avatar */}
                  <div className="flex-shrink-0">
                    <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-cyan-400/20 to-purple-500/20 border border-white/10 flex items-center justify-center overflow-hidden relative">
                      <Image
                        src={member.image}
                        alt={member.name}
                        fill
                        className="object-cover"
                        sizes="96px"
                      />
                    </div>
                  </div>

                  {/* Info */}
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-white mb-1">{member.name}</h3>
                    <p className="text-cyan-400 font-medium mb-3">{member.role}</p>
                    <p className="text-sm text-white/60 leading-relaxed mb-4">{member.bio}</p>

                    {/* Details */}
                    <div className="space-y-2 mb-4">
                      {member.details.map((detail, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm text-white/50">
                          <detail.icon className="w-4 h-4 text-white/30" />
                          <span>{detail.text}</span>
                        </div>
                      ))}
                    </div>

                    {/* Social Links */}
                    <div className="flex items-center gap-3">
                      {member.social.twitter && (
                        <a
                          href={member.social.twitter}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-9 h-9 flex items-center justify-center rounded-lg bg-white/5 border border-white/5 text-white/40 hover:text-cyan-400 hover:border-cyan-400/30 hover:bg-cyan-400/5 transition-all duration-200"
                          aria-label={`${member.name} on Twitter`}
                        >
                          <Twitter className="w-4 h-4" />
                        </a>
                      )}
                      {member.social.linkedin && (
                        <a
                          href={member.social.linkedin}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-9 h-9 flex items-center justify-center rounded-lg bg-white/5 border border-white/5 text-white/40 hover:text-cyan-400 hover:border-cyan-400/30 hover:bg-cyan-400/5 transition-all duration-200"
                          aria-label={`${member.name} on LinkedIn`}
                        >
                          <Linkedin className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Team Members */}
          <motion.div
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            className="max-w-xl mx-auto"
          >
            {teamMembers.map((member, index) => (
              <motion.div
                key={member.name}
                variants={fadeInUp}
                className="glass rounded-3xl p-8 group hover:border-cyan-400/20 transition-all duration-300"
              >
                <div className="flex flex-col sm:flex-row gap-6">
                  {/* Avatar */}
                  <div className="flex-shrink-0">
                    <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-cyan-400/20 to-purple-500/20 border border-white/10 flex items-center justify-center overflow-hidden relative">
                      <Image
                        src={member.image}
                        alt={member.name}
                        fill
                        className="object-cover"
                        sizes="96px"
                      />
                    </div>
                  </div>

                  {/* Info */}
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-white mb-1">{member.name}</h3>
                    {member.role && <p className="text-cyan-400 font-medium mb-3">{member.role}</p>}
                    <p className="text-sm text-white/60 leading-relaxed mb-4">{member.bio}</p>

                    {/* Details */}
                    <div className="space-y-2 mb-4">
                      {member.details.map((detail, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm text-white/50">
                          <detail.icon className="w-4 h-4 text-white/30" />
                          <span>{detail.text}</span>
                        </div>
                      ))}
                    </div>

                    {/* Social Links */}
                    <div className="flex items-center gap-3">
                      {member.social.twitter && (
                        <a
                          href={member.social.twitter}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-9 h-9 flex items-center justify-center rounded-lg bg-white/5 border border-white/5 text-white/40 hover:text-cyan-400 hover:border-cyan-400/30 hover:bg-cyan-400/5 transition-all duration-200"
                          aria-label={`${member.name} on Twitter`}
                        >
                          <Twitter className="w-4 h-4" />
                        </a>
                      )}
                      {member.social.linkedin && (
                        <a
                          href={member.social.linkedin}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-9 h-9 flex items-center justify-center rounded-lg bg-white/5 border border-white/5 text-white/40 hover:text-cyan-400 hover:border-cyan-400/30 hover:bg-cyan-400/5 transition-all duration-200"
                          aria-label={`${member.name} on LinkedIn`}
                        >
                          <Linkedin className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA Section - Creative Design */}
      <section className="relative py-32 overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Gradient orbs */}
          <motion.div 
            animate={{ 
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -top-40 -left-40 w-80 h-80 bg-cyan-500/20 rounded-full blur-[100px]" 
          />
          <motion.div 
            animate={{ 
              scale: [1.2, 1, 1.2],
              opacity: [0.2, 0.4, 0.2],
            }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -bottom-40 -right-40 w-96 h-96 bg-purple-500/20 rounded-full blur-[120px]" 
          />
        </div>

        <div className="container-custom relative">
          {/* Main CTA Content */}
          <div className="relative">
            {/* Decorative floating cards */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="hidden lg:block absolute -left-8 top-1/2 -translate-y-1/2 z-10"
            >
              <motion.div
                animate={{ y: [0, -10, 0], rotate: [-2, 2, -2] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                className="w-48 p-4 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border border-emerald-500/20 backdrop-blur-sm"
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                    <DollarSign className="w-4 h-4 text-emerald-400" />
                  </div>
                  <span className="text-emerald-400 text-xs font-medium">Instant Payout</span>
                </div>
                <p className="text-white text-sm font-semibold">+$450.00 USDC</p>
                <p className="text-white/40 text-xs">Just now • 3.2s</p>
              </motion.div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.5 }}
              className="hidden lg:block absolute -right-8 top-1/3 z-10"
            >
              <motion.div
                animate={{ y: [0, 10, 0], rotate: [2, -2, 2] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                className="w-52 p-4 rounded-2xl bg-gradient-to-br from-cyan-500/10 to-cyan-500/5 border border-cyan-500/20 backdrop-blur-sm"
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center">
                    <Receipt className="w-4 h-4 text-cyan-400" />
                  </div>
                  <span className="text-cyan-400 text-xs font-medium">AI Verified</span>
                </div>
                <p className="text-white text-sm font-semibold">Receipt Approved ✓</p>
                <p className="text-white/40 text-xs">Processed in 2.1s</p>
              </motion.div>
            </motion.div>

            {/* Center Content */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="max-w-3xl mx-auto text-center relative z-20"
            >
              {/* Animated ring decoration */}
              <div className="relative inline-block mb-8">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 w-24 h-24 mx-auto"
                >
                  <svg viewBox="0 0 100 100" className="w-full h-full">
                    <defs>
                      <linearGradient id="ring-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#22D3EE" stopOpacity="0.8" />
                        <stop offset="50%" stopColor="#A855F7" stopOpacity="0.4" />
                        <stop offset="100%" stopColor="#22D3EE" stopOpacity="0.8" />
                      </linearGradient>
                    </defs>
                    <circle
                      cx="50"
                      cy="50"
                      r="45"
                      fill="none"
                      stroke="url(#ring-gradient)"
                      strokeWidth="1"
                      strokeDasharray="20 10"
                    />
                  </svg>
                </motion.div>
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-cyan-400/20 to-purple-500/20 border border-white/10 flex items-center justify-center relative">
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Rocket className="w-10 h-10 text-cyan-400" />
                  </motion.div>
                </div>
              </div>

              <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
                <span className="text-white">Stop Waiting.</span>
                <br />
                <span className="bg-gradient-to-r from-cyan-400 via-cyan-300 to-purple-400 bg-clip-text text-transparent">
                  Start Building.
                </span>
              </h2>

              <p className="text-lg md:text-xl text-white/60 max-w-2xl mx-auto mb-10 leading-relaxed">
                Join the movement of companies who've eliminated the 
                <span className="text-white font-medium"> weeks of waiting</span> and replaced it with 
                <span className="text-cyan-400 font-medium"> seconds of settlement</span>.
              </p>

              {/* CTA Buttons with unique styling */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
                <Link
                  href="/#waitlist"
                  className="group relative px-8 py-4 bg-gradient-to-r from-cyan-500 to-cyan-400 rounded-2xl text-black font-semibold text-lg overflow-hidden transition-all duration-300 hover:shadow-[0_0_40px_rgba(34,211,238,0.4)] hover:scale-105"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    <Sparkles className="w-5 h-5" />
                    Get Early Access
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </span>
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-cyan-300 to-cyan-500"
                    initial={{ x: "100%" }}
                    whileHover={{ x: 0 }}
                    transition={{ duration: 0.3 }}
                  />
                </Link>

                <Link
                  href="mailto:contact@reimburseai.app"
                  className="group px-8 py-4 rounded-2xl text-white font-medium text-lg border border-white/10 bg-white/5 backdrop-blur-sm hover:bg-white/10 hover:border-white/20 transition-all duration-300 flex items-center gap-2"
                >
                  <MessageCircle className="w-5 h-5 text-white/60 group-hover:text-cyan-400 transition-colors" />
                  Let's Talk
                </Link>
              </div>

              {/* Social Links - Creative horizontal line design */}
              <div className="relative">
                <div className="absolute left-0 right-0 top-1/2 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                
                <div className="relative inline-flex items-center gap-6 px-8 py-3 bg-navy-950 rounded-full border border-white/5">
                  <span className="text-sm text-white/40">Follow the journey</span>
                  
                  <div className="flex items-center gap-2">
                    <a
                      href="https://x.com/reimburseai"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 border border-white/5 text-white/40 hover:text-white hover:bg-[#1DA1F2]/10 hover:border-[#1DA1F2]/30 transition-all duration-200"
                      aria-label="Twitter"
                    >
                      <Twitter className="w-4 h-4" />
                    </a>
                    <a
                      href="https://www.linkedin.com/company/reimburse-ai"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 border border-white/5 text-white/40 hover:text-white hover:bg-[#0A66C2]/10 hover:border-[#0A66C2]/30 transition-all duration-200"
                      aria-label="LinkedIn"
                    >
                      <Linkedin className="w-4 h-4" />
                    </a>
                    <a
                      href="https://github.com/Reimburse-AI"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 border border-white/5 text-white/40 hover:text-white hover:bg-purple-500/10 hover:border-purple-500/30 transition-all duration-200"
                      aria-label="GitHub"
                    >
                      <Github className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              </div>

              {/* Trust indicators */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.6 }}
                className="mt-12 flex flex-wrap items-center justify-center gap-8 text-sm text-white/40"
              >
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-cyan-400" />
                  <span>&lt; 5s average payout</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Private Beta Open</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-cyan-400" />
                  <span>contact@reimburseai.app</span>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
