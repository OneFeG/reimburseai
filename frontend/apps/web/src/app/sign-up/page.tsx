"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ConnectButton, useActiveAccount } from "thirdweb/react";
import {
  ArrowLeft,
  Building2,
  User,
  ArrowRight,
  CheckCircle,
  Lock,
  Sparkles,
} from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { thirdwebClient, walletConfigs } from "@/lib/thirdweb";
import { useAuth } from "@/context/auth-context";

type AccountType = "company" | "employee" | null;

export default function SignUpPage() {
  const router = useRouter();
  const account = useActiveAccount();
  const { isConnected, user, isDemo } = useAuth();
  const [accountType, setAccountType] = useState<AccountType>(null);
  const [step, setStep] = useState(1);

  // Only redirect to dashboard if in demo mode (admin access)
  useEffect(() => {
    if (isDemo && isConnected && user) {
      router.push("/dashboard");
    }
  }, [isConnected, user, isDemo, router]);

  // Handle wallet connection - app not public yet
  const handleWalletConnect = async () => {
    // For now, stay on page - dashboard access is admin-only via /demo
  };

  return (
    <div className="min-h-screen bg-navy-900 flex flex-col">
      {/* Background */}
      <div className="fixed inset-0 bg-grid-pattern opacity-[0.02] pointer-events-none" />
      <div className="fixed top-0 right-0 w-[600px] h-[600px] bg-purple-400/5 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-0 left-0 w-[600px] h-[600px] bg-cyan-400/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <header className="relative z-10 p-6">
        <Link href="/" className="inline-flex items-center gap-2 text-white/50 hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to home
        </Link>
      </header>

      {/* Main content */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          {/* Logo */}
          <div className="text-center mb-8">
            <Link href="/" className="inline-block">
              <Logo className="h-10 mx-auto" />
            </Link>
          </div>

          {/* Sign up card */}
          <div className="p-8 rounded-2xl bg-white/[0.02] border border-white/10 backdrop-blur-sm">
            {/* Progress indicator */}
            <div className="flex items-center justify-center gap-2 mb-8">
              <div className={`w-2 h-2 rounded-full ${step >= 1 ? "bg-cyan-400" : "bg-white/20"}`} />
              <div className={`w-8 h-px ${step >= 2 ? "bg-cyan-400" : "bg-white/20"}`} />
              <div className={`w-2 h-2 rounded-full ${step >= 2 ? "bg-cyan-400" : "bg-white/20"}`} />
            </div>

            {step === 1 ? (
              <>
                <h1 className="text-2xl font-bold text-white text-center mb-2">
                  Get started
                </h1>
                <p className="text-white/50 text-center mb-8">
                  How will you use Reimburse AI?
                </p>

                {/* Account type selection */}
                <div className="space-y-4">
                  <AccountTypeCard
                    type="company"
                    icon={Building2}
                    title="I'm a Company"
                    description="Set up expense management for your team"
                    selected={accountType === "company"}
                    onSelect={() => setAccountType("company")}
                  />
                  <AccountTypeCard
                    type="employee"
                    icon={User}
                    title="I'm an Employee"
                    description="Submit expenses and get reimbursed"
                    selected={accountType === "employee"}
                    onSelect={() => setAccountType("employee")}
                  />
                </div>

                {/* Continue button */}
                <button
                  onClick={() => setStep(2)}
                  disabled={!accountType}
                  className="w-full btn-primary mt-8 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Continue
                  <ArrowRight className="w-4 h-4" />
                </button>
              </>
            ) : (
              <>
                <h1 className="text-2xl font-bold text-white text-center mb-2">
                  Create your account
                </h1>
                <p className="text-white/50 text-center mb-8">
                  {accountType === "company"
                    ? "Connect your wallet to set up your company"
                    : "Connect your wallet to start submitting expenses"}
                </p>

                {/* Sign up options */}
                <div className="space-y-4">
                  {/* Wallet connect */}
                  <div className="space-y-3">
                    <label className="block text-white/70 text-sm font-medium mb-2">
                      Connect with wallet
                    </label>
                    <div className="thirdweb-connect-wrapper">
                      <ConnectButton
                        client={thirdwebClient}
                        wallets={walletConfigs}
                        connectModal={{
                          size: "compact",
                          title: "Create Account",
                          showThirdwebBranding: false,
                        }}
                        onConnect={handleWalletConnect}
                      />
                    </div>
                  </div>

                  {/* Private access notice */}
                  <div className="mt-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                    <div className="flex items-start gap-3">
                      <Lock className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-amber-400 text-sm font-medium">Private Beta</p>
                        <p className="text-white/50 text-xs mt-1">
                          Access is currently limited to authorized wallets only.
                          Join the waitlist to get early access.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Waitlist CTA */}
                  <Link
                    href="/#waitlist"
                    className="flex items-center justify-center gap-2 w-full px-4 py-3 mt-4 text-black font-semibold bg-cyan-400 rounded-xl hover:bg-cyan-300 transition-colors"
                  >
                    <Sparkles className="w-4 h-4" />
                    Join Waitlist for Early Access
                  </Link>
                </div>

                {/* Back button */}
                <button
                  onClick={() => setStep(1)}
                  className="w-full text-white/50 hover:text-white text-sm mt-6 transition-colors"
                >
                  ← Back to account type
                </button>
              </>
            )}

            {/* Sign in link */}
            <p className="text-center text-white/50 text-sm mt-8">
              Already have an account?{" "}
              <Link
                href="/sign-in"
                className="text-cyan-400 hover:text-cyan-300 transition-colors"
              >
                Sign in
              </Link>
            </p>
          </div>

          {/* Terms */}
          <p className="text-center text-white/30 text-xs mt-6">
            By creating an account, you agree to our{" "}
            <Link href="/terms" className="text-white/50 hover:text-white transition-colors">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="text-white/50 hover:text-white transition-colors">
              Privacy Policy
            </Link>
          </p>
        </motion.div>
      </main>
    </div>
  );
}

function AccountTypeCard({
  type,
  icon: Icon,
  title,
  description,
  selected,
  onSelect,
}: {
  type: string;
  icon: any;
  title: string;
  description: string;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all ${
        selected
          ? "bg-cyan-400/10 border-cyan-400/50"
          : "bg-white/[0.02] border-white/10 hover:border-white/20"
      }`}
    >
      <div
        className={`w-12 h-12 rounded-xl flex items-center justify-center ${
          selected ? "bg-cyan-400/20 text-cyan-400" : "bg-white/5 text-white/50"
        }`}
      >
        <Icon className="w-6 h-6" />
      </div>
      <div className="flex-1 text-left">
        <h3 className="text-white font-medium">{title}</h3>
        <p className="text-white/50 text-sm">{description}</p>
      </div>
      {selected && (
        <CheckCircle className="w-5 h-5 text-cyan-400" />
      )}
    </button>
  );
}
