"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/context/auth-context";

export default function DemoPage() {
  const router = useRouter();
  const { enableDemoMode } = useAuth();

  useEffect(() => {
    // Set demo mode and redirect to dashboard
    enableDemoMode();

    // Small delay for UX
    const timer = setTimeout(() => {
      router.push("/dashboard");
    }, 1500);

    return () => clearTimeout(timer);
  }, [router, enableDemoMode]);

  return (
    <div className="min-h-screen bg-navy-900 flex items-center justify-center">
      {/* Background */}
      <div className="fixed inset-0 bg-grid-pattern opacity-[0.02] pointer-events-none" />
      <div className="fixed top-0 left-0 w-[600px] h-[600px] bg-cyan-400/5 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-0 right-0 w-[600px] h-[600px] bg-purple-400/5 rounded-full blur-3xl pointer-events-none" />

      <div className="text-center">
        <Loader2 className="w-12 h-12 text-cyan-400 animate-spin mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-white mb-2">
          Setting up Demo Mode
        </h1>
        <p className="text-white/50">
          Preparing your demo environment with sample data...
        </p>
      </div>
    </div>
  );
}
