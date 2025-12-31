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
  Loader2,
  CheckCircle,
} from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { thirdwebClient, walletConfigs } from "@/lib/thirdweb";
import { useAuth } from "@/context/auth-context";

type AccountType = "company" | "employee" | null;

export default function SignUpPage() {
  const router = useRouter();
  const account = useActiveAccount();
  const { enableDemoMode, isConnected, user } = useAuth();
  const [accountType, setAccountType] = useState<AccountType>(null);
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  // Redirect to dashboard if already connected
  useEffect(() => {
    if (isConnected && user) {
      router.push("/dashboard");
    }
  }, [isConnected, user, router]);

  // Handle demo mode sign up
  const handleDemoSignUp = async () => {
    setIsLoading(true);
    
    // Simulate loading
    await new Promise((resolve) => setTimeout(resolve, 1000));
    
    enableDemoMode();
    router.push("/dashboard");
  };

  // Handle wallet connection success
  const handleWalletConnect = async () => {
    if (account?.address) {
      router.push("/dashboard/onboarding");
    }
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
                  How will you use Reimburse.ai?
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

                  {/* Divider */}
                  <div className="relative py-4">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-white/10" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-4 bg-navy-900 text-white/40">or</span>
                    </div>
                  </div>

                  {/* Demo mode */}
                  <div>
                    <label className="block text-white/70 text-sm font-medium mb-2">
                      Try without a wallet
                    </label>
                    <button
                      onClick={handleDemoSignUp}
                      disabled={isLoading}
                      className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 hover:border-white/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Setting up demo...
                        </>
                      ) : (
                        <>
                          <User className="w-5 h-5" />
                          Continue as Demo User
                        </>
                      )}
                    </button>
                    <p className="text-white/30 text-xs text-center mt-2">
                      Explore with simulated data - no wallet required
                    </p>
                  </div>
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
