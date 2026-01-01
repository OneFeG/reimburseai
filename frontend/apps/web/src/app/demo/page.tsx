"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Shield, AlertTriangle } from "lucide-react";
import Link from "next/link";

// This page is deprecated - admin access is now via wallet
// Redirect to sign-in page where admin wallet can connect

export default function AdminAccessPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to sign-in after a brief moment
    const timer = setTimeout(() => {
      router.push("/sign-in");
    }, 2000);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-screen bg-navy-900 flex items-center justify-center p-4">
      {/* Background */}
      <div className="fixed inset-0 bg-grid-pattern opacity-[0.02] pointer-events-none" />
      <div className="fixed top-0 left-0 w-[600px] h-[600px] bg-cyan-400/5 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-0 right-0 w-[600px] h-[600px] bg-purple-400/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 w-full max-w-md text-center">
        <div className="p-8 rounded-2xl bg-white/[0.02] border border-white/10 backdrop-blur-sm">
          <Shield className="w-12 h-12 text-cyan-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">
            Admin Access Updated
          </h1>
          <p className="text-white/50 mb-6">
            Admin access is now via authorized wallet connection.
            Redirecting to sign-in...
          </p>
          <Loader2 className="w-6 h-6 text-cyan-400 animate-spin mx-auto mb-4" />
          <p className="text-white/30 text-xs">
            Connect wallet{" "}
            <code className="text-cyan-400/70">0x74ef...928f</code>{" "}
            to access admin dashboard
          </p>
          <Link
            href="/sign-in"
            className="inline-block mt-4 text-cyan-400 hover:text-cyan-300 text-sm"
          >
            Go to Sign In →
          </Link>
        </div>
      </div>
    </div>
  );
}
