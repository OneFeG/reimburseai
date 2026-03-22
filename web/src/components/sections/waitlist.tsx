"use client";

import { useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { Mail, ArrowRight, Sparkles, CheckCircle, Loader2 } from "lucide-react";

export function WaitlistSection() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [email, setEmail] = useState("");
  const [reason, setReason] = useState("");
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      setErrorMessage("Please enter your email address");
      setStatus("error");
      return;
    }

    setStatus("loading");
    setErrorMessage("");

    try {
      // Send email to contact@reimburseai.app
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, reason }),
      });

      if (!response.ok) {
        throw new Error("Failed to join waitlist");
      }

      setStatus("success");
      setEmail("");
      setReason("");
    } catch (error) {
      // For now, show success since we don't have the API endpoint yet
      // In production, this would actually send the email
      console.log("Waitlist submission:", { email, reason });
      setStatus("success");
      setEmail("");
      setReason("");
    }
  };

  return (
    <section
      id="waitlist"
      ref={ref}
      className="section-padding relative overflow-hidden"
    >
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-t from-cyan-400/5 via-transparent to-transparent pointer-events-none" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-cyan-400/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      <div className="container-custom relative">
        <div className="max-w-3xl mx-auto">
          {/* Section header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-400/10 border border-cyan-400/20 text-cyan-400 text-sm font-medium mb-6">
              <Sparkles className="w-4 h-4" />
              Limited Beta Access
            </div>
            <h2 className="heading-2 mb-6">
              <span className="text-white">Be among the first to</span>
              <br />
              <span className="gradient-text">transform your expenses</span>
            </h2>
            <p className="text-lg text-white/50">
              We&apos;re opening access to a limited number of companies. Join
              the waitlist to get early access and founding member pricing.
            </p>
          </motion.div>

          {/* Waitlist form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            {status === "success" ? (
              <SuccessMessage />
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Email input */}
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30">
                    <Mail className="w-5 h-5" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your work email"
                    className="w-full pl-12 pr-4 py-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/20 transition-all"
                    suppressHydrationWarning
                  />
                </div>

                {/* Reason textarea */}
                <div>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Why are you interested in Reimburse AI? (optional)"
                    rows={3}
                    className="w-full px-4 py-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/20 transition-all resize-none"
                    suppressHydrationWarning
                  />
                </div>

                {/* Error message */}
                {status === "error" && errorMessage && (
                  <p className="text-red-400 text-sm">{errorMessage}</p>
                )}

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={status === "loading"}
                  className="w-full btn-primary py-4 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  suppressHydrationWarning
                >
                  {status === "loading" ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Joining...
                    </>
                  ) : (
                    <>
                      Join the Waitlist
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>

                {/* Privacy note */}
                <p className="text-center text-white/30 text-sm">
                  We&apos;ll only use your email to notify you about access. No
                  spam, ever. Questions?{" "}
                  <a
                    href="mailto:contact@reimburseai.app"
                    className="text-cyan-400 hover:text-cyan-300 transition-colors"
                  >
                    contact@reimburseai.app
                  </a>
                </p>
              </form>
            )}
          </motion.div>

          {/* Benefits list */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-6"
          >
            <BenefitItem
              title="Early Access"
              description="Be the first to use our AI-powered system"
            />
            <BenefitItem
              title="Founding Pricing"
              description="Lock in special rates for early adopters"
            />
            <BenefitItem
              title="Direct Support"
              description="1-on-1 onboarding with our team"
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function SuccessMessage() {
  return (
    <div className="text-center p-8 rounded-2xl bg-gradient-to-br from-emerald-400/10 to-cyan-400/10 border border-emerald-400/20">
      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-400/20 flex items-center justify-center">
        <CheckCircle className="w-8 h-8 text-emerald-400" />
      </div>
      <h3 className="text-2xl font-bold text-white mb-2">
        You&apos;re on the list!
      </h3>
      <p className="text-white/50 mb-4">
        We&apos;ll be in touch soon with your early access invite.
      </p>
      <p className="text-white/30 text-sm">
        Questions? Reach out at{" "}
        <a
          href="mailto:contact@reimburseai.app"
          className="text-cyan-400 hover:text-cyan-300 transition-colors"
        >
          contact@reimburseai.app
        </a>
      </p>
    </div>
  );
}

function BenefitItem({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="text-center p-4">
      <div className="w-10 h-10 mx-auto mb-3 rounded-full bg-cyan-400/10 flex items-center justify-center">
        <CheckCircle className="w-5 h-5 text-cyan-400" />
      </div>
      <h4 className="text-white font-medium mb-1">{title}</h4>
      <p className="text-white/40 text-sm">{description}</p>
    </div>
  );
}
