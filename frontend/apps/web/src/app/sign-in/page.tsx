"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ConnectButton, useActiveAccount } from "thirdweb/react";
import { ArrowLeft, Lock, Sparkles } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { thirdwebClient, walletConfigs } from "@/lib/thirdweb";
import { useAuth, isAdminWallet } from "@/context/auth-context";

export default function SignInPage() {
  const router = useRouter();
  const account = useActiveAccount();
  const { isConnected, user, isDemo, isAdmin, is2FAVerified } = useAuth();

  // Redirect logic:
  // 1. Admin wallet = direct to dashboard (bypasses 2FA for testing)
  // 2. Wallet connected + not 2FA verified = go to 2FA page
  // 3. Wallet connected + 2FA verified = go to dashboard
  useEffect(() => {
    // Admin wallet = immediate dashboard access for testing
    if (isAdmin && account?.address) {
      router.push("/dashboard");
      return;
    }
    
    // Regular wallet connected - need 2FA
    if (account?.address && !isAdmin) {
      if (is2FAVerified) {
        // 2FA already verified, go to dashboard
        router.push("/dashboard");
      } else {
        // Need 2FA verification
        router.push("/verify");
      }
      return;
    }
    
    // Demo mode
    if (isDemo && isConnected && user) {
      router.push("/dashboard");
    }
  }, [isConnected, user, isDemo, isAdmin, is2FAVerified, account?.address, router]);

  // Handle wallet connection
  const handleWalletConnect = async () => {
    // Redirect will happen via useEffect after wallet connects
  };

  return (
    <div className="min-h-screen bg-navy-900 flex flex-col">
      {/* Background */}
      <div className="fixed inset-0 bg-grid-pattern opacity-[0.02] pointer-events-none" />
      <div className="fixed top-0 left-0 w-[600px] h-[600px] bg-cyan-400/5 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-0 right-0 w-[600px] h-[600px] bg-purple-400/5 rounded-full blur-3xl pointer-events-none" />

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

          {/* Sign in card */}
          <div className="p-8 rounded-2xl bg-white/[0.02] border border-white/10 backdrop-blur-sm">
            <h1 className="text-2xl font-bold text-white text-center mb-2">
              Welcome back
            </h1>
            <p className="text-white/50 text-center mb-8">
              Sign in to access your dashboard
            </p>

            {/* Sign in options */}
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
                      title: "Sign In",
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
                    <p className="text-amber-400 text-sm font-medium">Coming Soon</p>
                    <p className="text-white/50 text-xs mt-1">
                      We&apos;re currently in private beta. Join our waitlist to be 
                      notified when we launch publicly.
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

            {/* Home link */}
            <p className="text-center text-white/50 text-sm mt-8">
              <Link
                href="/"
                className="text-cyan-400 hover:text-cyan-300 transition-colors"
              >
                ← Back to Home
              </Link>
            </p>
          </div>

          {/* Terms */}
          <p className="text-center text-white/30 text-xs mt-6">
            By signing in, you agree to our{" "}
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
