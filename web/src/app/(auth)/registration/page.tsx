"use client";

import { ProtectedRoute } from "@/components/protectedRoute";
import { Logo } from "@/components/brand/logo";
import { useAuth, useProfile } from "@/hooks";
import api from "@/lib/api/client";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  CheckCircle,
  IdCard,
  Loader2,
  User,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";

type RegistrationType = "employee" | "company";

export default function RegistrationPage() {
  const router = useRouter();
  const { user, markRegistrationComplete } = useAuth();
  const { refreshProfile } = useProfile();
  const email = user?.email || "";

  const [registrationType, setRegistrationType] =
    useState<RegistrationType>("employee");
  const [step, setStep] = useState<1 | 2>(1);
  const [name, setName] = useState("");
  const [identificationNumber, setIdentificationNumber] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const setType = (type: RegistrationType) => {
    setRegistrationType(type);
  };

  const title = useMemo(() => {
    if (registrationType === "company") return "Register Your Company";
    return "Register as an Employee";
  }, [registrationType]);

  const subtitle = useMemo(() => {
    if (step === 1) return "Start by telling us your name";
    return "Add your identification number to complete setup";
  }, [step]);

  const canContinue = useMemo(() => {
    if (step === 1) return name.trim().length > 0;
    return identificationNumber.trim().length > 0;
  }, [step, name, identificationNumber]);

  const handleNext = () => {
    if (!canContinue) return;
    setStep(2);
  };

  const handleBack = () => {
    setStep(1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error("No email found for this session. Please sign in again.");
      router.push("/");
      return;
    }

    if (!name.trim() || !identificationNumber.trim()) {
      toast.error("Please complete all fields");
      return;
    }

    setIsLoading(true);
    try {
      if (!user?.uid) {
        toast.error("No user session found. Please sign in again.");
        router.push("/");
        return;
      }

      const parsedIdNumber = Number(identificationNumber.trim());
      if (
        !Number.isFinite(parsedIdNumber) ||
        !Number.isInteger(parsedIdNumber) ||
        parsedIdNumber <= 0 ||
        identificationNumber.trim().length > 15
      ) {
        toast.error("Identification number must be a valid number");
        return;
      }

      const payload = {
        name: name.trim(),
        IdentificationNumber: parsedIdNumber,
      };

      if (registrationType === "company") {
        const companyResponse = await api.post("/companyup", payload);

        if (!companyResponse?.success) {
          toast.error(companyResponse?.error?.message || "Registration failed");
          return;
        }
      } else {
        const response = await api.post("/employeeup", payload);

        if (!response?.success) {
          toast.error(response?.error?.message || "Registration failed");
          return;
        }
      }

      await markRegistrationComplete(registrationType);
      await refreshProfile();
      toast.success("Registration completed successfully!");
      if (registrationType === "company") {
        router.push("/dashboard/settings?tab=policies&onboarding=1");
      } else {
        router.push("/dashboard");
      }
    } catch (error: any) {
      const message = error?.message || "Registration failed";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4">
        <div className="fixed inset-0 bg-grid-pattern opacity-[0.02] pointer-events-none" />
        <div className="fixed top-0 left-0 w-[500px] h-[500px] bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="fixed bottom-0 right-0 w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="w-full max-w-md space-y-8 relative z-10">
          <div className="flex flex-col items-center text-center">
            <Logo className="mb-6 scale-125" />
            <h2 className="text-2xl font-bold text-white tracking-tight">
              {title}
            </h2>
            <p className="text-gray-400 mt-2">{subtitle}</p>
          </div>

          <div className="bg-[#111] border border-[#333] rounded-xl p-8 space-y-6 shadow-2xl backdrop-blur-sm">
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setType("employee")}
                className={`flex items-center justify-center gap-2 py-3 rounded-lg border transition-all ${
                  registrationType === "employee"
                    ? "bg-[#22D3EE] text-black border-[#22D3EE]"
                    : "bg-black/50 text-gray-300 border-[#333] hover:border-[#22D3EE]/50"
                }`}
              >
                <User className="w-4 h-4" />
                Employee
              </button>
              <button
                type="button"
                onClick={() => setType("company")}
                className={`flex items-center justify-center gap-2 py-3 rounded-lg border transition-all ${
                  registrationType === "company"
                    ? "bg-[#22D3EE] text-black border-[#22D3EE]"
                    : "bg-black/50 text-gray-300 border-[#333] hover:border-[#22D3EE]/50"
                }`}
              >
                <Building2 className="w-4 h-4" />
                Company
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {step === 1 ? (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300 ml-1">
                    Name
                  </label>
                  <div className="relative group">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-[#22D3EE] transition-colors">
                      <CheckCircle className="w-5 h-5" />
                    </div>
                    <input
                      type="text"
                      placeholder={
                        registrationType === "company"
                          ? "Company name"
                          : "Full name"
                      }
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-black/50 border border-[#333] rounded-lg py-3 pl-10 pr-4 text-white placeholder:text-gray-600 focus:outline-none focus:border-[#22D3EE] focus:ring-1 focus:ring-[#22D3EE] transition-all"
                      required
                    />
                  </div>
                  <div className="text-xs text-gray-500 ml-1">
                    Signed in as {email || "unknown"}
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300 ml-1">
                    Identification Number
                  </label>
                  <div className="relative group">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-[#22D3EE] transition-colors">
                      <IdCard className="w-5 h-5" />
                    </div>
                    <input
                      type="text"
                      placeholder={
                        registrationType === "company"
                          ? "Company registration number"
                          : "Employee ID number"
                      }
                      value={identificationNumber}
                      onChange={(e) => setIdentificationNumber(e.target.value)}
                      className="w-full bg-black/50 border border-[#333] rounded-lg py-3 pl-10 pr-4 text-white placeholder:text-gray-600 focus:outline-none focus:border-[#22D3EE] focus:ring-1 focus:ring-[#22D3EE] transition-all"
                      required
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between gap-3 pt-2">
                {step === 2 ? (
                  <button
                    type="button"
                    onClick={handleBack}
                    className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg border border-[#333] text-gray-300 hover:border-[#22D3EE]/50 transition-all"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back
                  </button>
                ) : (
                  <div />
                )}

                {step === 1 ? (
                  <button
                    type="button"
                    onClick={handleNext}
                    disabled={!canContinue}
                    className="flex-1 bg-[#22D3EE] hover:bg-[#1ebacf] text-black font-semibold py-3 rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={!canContinue || isLoading}
                    className="flex-1 bg-[#22D3EE] hover:bg-[#1ebacf] text-black font-semibold py-3 rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        Finish
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
