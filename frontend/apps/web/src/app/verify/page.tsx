"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { Mail, Shield, Loader2, ArrowLeft, RefreshCw, CheckCircle } from "lucide-react";
import { useActiveAccount } from "thirdweb/react";
import { Logo } from "@/components/ui/logo";
import { useAuth } from "@/context/auth-context";
import { api } from "@/lib/api/client";

// API response types
interface TwoFARequestResponse {
  success: boolean;
  message: string;
  email_hint?: string;
}

interface TwoFAVerifyResponse {
  success: boolean;
  message: string;
  employee_id?: string;
  employee_name?: string;
  companies?: Array<{ id: string; name: string; role: string }>;
}

export default function Verify2FAPage() {
  const router = useRouter();
  const account = useActiveAccount();
  const { complete2FA, isAdmin } = useAuth();
  
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [emailHint, setEmailHint] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Request 2FA code when page loads
  useEffect(() => {
    if (account?.address && !codeSent) {
      requestCode();
    }
  }, [account?.address]);

  // Redirect if no wallet connected
  useEffect(() => {
    if (!account?.address) {
      router.push("/sign-in");
    }
  }, [account, router]);

  // Admin wallet bypasses 2FA
  useEffect(() => {
    if (isAdmin) {
      router.push("/dashboard");
    }
  }, [isAdmin, router]);

  const requestCode = async () => {
    if (!account?.address) return;
    
    setIsSending(true);
    setError(null);
    
    try {
      const response = await api.post<TwoFARequestResponse>("/auth/2fa/request", {
        wallet_address: account.address,
      });
      
      if (response.success && response.data?.success) {
        setEmailHint(response.data.email_hint || null);
        setCodeSent(true);
      } else {
        setError(response.error?.message || "Failed to send verification code");
      }
    } catch (err: any) {
      const message = err.response?.data?.detail || "Failed to send verification code";
      setError(message);
    } finally {
      setIsSending(false);
    }
  };

  const resendCode = async () => {
    if (!account?.address) return;
    
    setIsResending(true);
    setError(null);
    
    try {
      const response = await api.post<TwoFARequestResponse>("/auth/2fa/resend", {
        wallet_address: account.address,
      });
      
      if (response.success && response.data?.success) {
        setEmailHint(response.data.email_hint || null);
        setCode(["", "", "", "", "", ""]);
        inputRefs.current[0]?.focus();
      } else {
        setError(response.error?.message || "Failed to resend code");
      }
    } catch (err: any) {
      const message = err.response?.data?.detail || "Failed to resend code";
      setError(message);
    } finally {
      setIsResending(false);
    }
  };

  const verifyCode = async () => {
    if (!account?.address) return;
    
    const fullCode = code.join("");
    if (fullCode.length !== 6) {
      setError("Please enter the complete 6-digit code");
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await api.post<TwoFAVerifyResponse>("/auth/2fa/verify", {
        wallet_address: account.address,
        code: fullCode,
      });
      
      if (response.success && response.data?.success) {
        setSuccess(true);
        
        // Complete 2FA in auth context
        if (complete2FA) {
          complete2FA(response.data);
        }
        
        // Redirect to dashboard after short delay
        setTimeout(() => {
          router.push("/dashboard");
        }, 1000);
      } else {
        setError(response.error?.message || "Verification failed");
        // Clear code on error
        setCode(["", "", "", "", "", ""]);
        inputRefs.current[0]?.focus();
      }
    } catch (err: any) {
      const message = err.response?.data?.detail || "Verification failed";
      setError(message);
      // Clear code on error
      setCode(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  const handleCodeChange = (index: number, value: string) => {
    // Only allow digits
    if (value && !/^\d$/.test(value)) return;
    
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);
    
    // Auto-advance to next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
    
    // Auto-submit when all digits entered
    if (value && index === 5 && newCode.every(d => d)) {
      setTimeout(() => verifyCode(), 100);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === "Enter") {
      verifyCode();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      const newCode = pasted.split("");
      setCode(newCode);
      inputRefs.current[5]?.focus();
      setTimeout(() => verifyCode(), 100);
    }
  };

  if (!account?.address) {
    return null;
  }

  return (
    <div className="min-h-screen bg-navy-900 flex items-center justify-center p-4">
      {/* Background */}
      <div className="fixed inset-0 bg-grid opacity-20" />
      <div className="fixed top-0 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
      <div className="fixed bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full max-w-md"
      >
        {/* Card */}
        <div className="card p-8 border border-white/10 bg-navy-800/80 backdrop-blur-xl">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <Logo className="h-10" />
          </div>

          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-400/20 to-purple-400/20 flex items-center justify-center border border-cyan-400/20">
              {success ? (
                <CheckCircle className="w-8 h-8 text-emerald-400" />
              ) : (
                <Shield className="w-8 h-8 text-cyan-400" />
              )}
            </div>
          </div>

          {/* Title */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-white mb-2">
              {success ? "Verified!" : "Two-Factor Authentication"}
            </h1>
            <p className="text-white/50">
              {success ? (
                "Redirecting to dashboard..."
              ) : codeSent ? (
                <>
                  Enter the 6-digit code sent to{" "}
                  <span className="text-cyan-400 font-medium">{emailHint}</span>
                </>
              ) : (
                "Sending verification code..."
              )}
            </p>
          </div>

          {/* Loading state */}
          {isSending && !codeSent && (
            <div className="flex flex-col items-center gap-4 py-8">
              <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
              <p className="text-white/50">Sending verification code...</p>
            </div>
          )}

          {/* Success state */}
          {success && (
            <div className="flex flex-col items-center gap-4 py-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-16 h-16 rounded-full bg-emerald-400/20 flex items-center justify-center"
              >
                <CheckCircle className="w-8 h-8 text-emerald-400" />
              </motion.div>
            </div>
          )}

          {/* Code input */}
          {codeSent && !success && (
            <>
              {/* Error message */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="mb-6 p-4 rounded-xl bg-red-400/10 border border-red-400/20"
                  >
                    <p className="text-red-400 text-sm text-center">{error}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Code inputs */}
              <div className="flex justify-center gap-3 mb-8" onPaste={handlePaste}>
                {code.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => { inputRefs.current[index] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleCodeChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    className="w-12 h-14 text-center text-2xl font-bold text-white bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 transition-all"
                    disabled={isLoading}
                    autoFocus={index === 0}
                  />
                ))}
              </div>

              {/* Verify button */}
              <button
                onClick={verifyCode}
                disabled={isLoading || code.some(d => !d)}
                className="w-full btn-primary h-12 text-base disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  "Verify & Continue"
                )}
              </button>

              {/* Resend */}
              <div className="mt-6 text-center">
                <p className="text-white/40 text-sm mb-2">Didn't receive the code?</p>
                <button
                  onClick={resendCode}
                  disabled={isResending}
                  className="text-cyan-400 text-sm font-medium hover:text-cyan-300 transition-colors inline-flex items-center gap-2"
                >
                  {isResending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4" />
                      Resend Code
                    </>
                  )}
                </button>
              </div>
            </>
          )}

          {/* Back to sign in */}
          <div className="mt-8 pt-6 border-t border-white/10">
            <button
              onClick={() => router.push("/sign-in")}
              className="w-full flex items-center justify-center gap-2 text-white/50 hover:text-white text-sm transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Sign In
            </button>
          </div>
        </div>

        {/* Info */}
        <p className="text-center text-white/30 text-xs mt-6">
          2FA is required for all accounts to protect against wallet compromise
        </p>
      </motion.div>
    </div>
  );
}
