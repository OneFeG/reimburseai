"use client";

import { useState, useEffect } from "react";
import { Logo } from "@/components/brand/logo";
import { useAuth } from "@/context/auth-context";
import { thirdwebClient, chain, supportedWallets } from "@/lib/thirdweb";
import { companyApi, employeeApi } from "@/lib/api";
import { ConnectButton } from "thirdweb/react";
import { useRouter } from "next/navigation";
import { Building2, User, Wallet, ArrowRight, CheckCircle, Mail, Shield } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

type SignUpMode = "company" | "employee";

export default function SignUpPage() {
    const { isConnected, user, isLoading, refreshUser } = useAuth();
    const router = useRouter();
    
    const [mode, setMode] = useState<SignUpMode>("company");
    const [step, setStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Form data
    const [companyName, setCompanyName] = useState("");
    const [companySlug, setCompanySlug] = useState("");
    const [companyEmail, setCompanyEmail] = useState("");
    const [employeeName, setEmployeeName] = useState("");
    const [employeeEmail, setEmployeeEmail] = useState("");
    const [companyCode, setCompanyCode] = useState(""); // For joining existing company

    // Redirect if already has employee record
    useEffect(() => {
        if (isConnected && user?.employee) {
            router.push("/dashboard");
        }
    }, [isConnected, user, router]);

    // Generate slug from company name
    useEffect(() => {
        const slug = companyName
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-|-$/g, "");
        setCompanySlug(slug);
    }, [companyName]);

    const handleCreateCompany = async () => {
        if (!user?.walletAddress) {
            toast.error("Please connect your wallet first");
            return;
        }

        if (!companyName || !companySlug || !companyEmail || !employeeName) {
            toast.error("Please fill in all required fields");
            return;
        }

        setIsSubmitting(true);

        try {
            // 1. Create company
            const companyResponse = await companyApi.create({
                name: companyName,
                slug: companySlug,
                email: companyEmail,
            });

            if (!companyResponse.success || !companyResponse.data) {
                throw new Error(companyResponse.error?.message || "Failed to create company");
            }

            const company = companyResponse.data;

            // 2. Create admin employee with wallet
            const employeeResponse = await employeeApi.create(company.id, {
                name: employeeName,
                email: companyEmail,
                wallet_address: user.walletAddress,
                role: "admin",
            });

            if (!employeeResponse.success) {
                throw new Error(employeeResponse.error?.message || "Failed to create employee");
            }

            toast.success("Company created successfully!");
            
            // Refresh user data and redirect
            await refreshUser();
            router.push("/dashboard");

        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to create company");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleJoinCompany = async () => {
        if (!user?.walletAddress) {
            toast.error("Please connect your wallet first");
            return;
        }

        if (!employeeName || !employeeEmail || !companyCode) {
            toast.error("Please fill in all required fields");
            return;
        }

        setIsSubmitting(true);

        try {
            // Create employee with company code (company ID or slug)
            const employeeResponse = await employeeApi.create(companyCode, {
                name: employeeName,
                email: employeeEmail,
                wallet_address: user.walletAddress,
                role: "employee",
            });

            if (!employeeResponse.success) {
                throw new Error(employeeResponse.error?.message || "Failed to join company");
            }

            toast.success("Successfully joined company!");
            
            // Refresh user data and redirect
            await refreshUser();
            router.push("/dashboard");

        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to join company");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-md space-y-8">
                <div className="flex flex-col items-center text-center">
                    <Logo className="mb-6 scale-125" />
                    <h2 className="text-2xl font-bold text-white tracking-tight">
                        Get Started
                    </h2>
                    <p className="text-gray-400 mt-2">
                        Connect your wallet to create or join a company
                    </p>
                </div>

                <div className="bg-[#111] border border-[#333] rounded-xl p-8 space-y-6 shadow-2xl">
                    {/* Step 1: Connect Wallet */}
                    {!isConnected ? (
                        <div className="space-y-6">
                            <div className="flex items-center gap-3 text-sm text-gray-300">
                                <div className="p-2 rounded-lg bg-[#22D3EE]/10">
                                    <Wallet className="w-5 h-5 text-[#22D3EE]" />
                                </div>
                                <div>
                                    <p className="font-medium text-white">Step 1: Create Account</p>
                                    <p className="text-gray-500">Use email, social, or wallet</p>
                                </div>
                            </div>

                            {/* Auth method hints */}
                            <div className="grid grid-cols-2 gap-2 text-xs text-gray-500">
                                <div className="flex items-center gap-1.5">
                                    <Mail className="w-3.5 h-3.5" />
                                    <span>Email (no password)</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <Shield className="w-3.5 h-3.5" />
                                    <span>Google / Apple</span>
                                </div>
                            </div>

                            <div className="flex justify-center">
                                <ConnectButton
                                    client={thirdwebClient}
                                    chain={chain}
                                    wallets={supportedWallets}
                                    connectModal={{
                                        size: "wide",
                                        title: "Create Account",
                                        titleIcon: "",
                                        showThirdwebBranding: false,
                                    }}
                                    connectButton={{
                                        label: "Create Account",
                                        style: {
                                            backgroundColor: "#22D3EE",
                                            color: "#000",
                                            fontWeight: "600",
                                            padding: "14px 32px",
                                            borderRadius: "8px",
                                            fontSize: "15px",
                                            width: "100%",
                                        },
                                    }}
                                    detailsButton={{
                                        render: () => (
                                            <div className="bg-[#111] border border-[#333] rounded-lg px-4 py-2 text-white text-sm cursor-pointer hover:bg-[#1a1a1a] transition-colors">
                                                Connected ✓
                                            </div>
                                        ),
                                    }}
                                />
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* Connected wallet indicator */}
                            <div className="flex items-center gap-3 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                                <CheckCircle className="w-5 h-5 text-green-500" />
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-green-400">Wallet Connected</p>
                                    <p className="text-xs text-gray-500 font-mono">
                                        {user?.walletAddress?.slice(0, 6)}...{user?.walletAddress?.slice(-4)}
                                    </p>
                                </div>
                            </div>

                            {/* Mode selector */}
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    onClick={() => setMode("company")}
                                    className={`p-4 rounded-lg border transition-all ${
                                        mode === "company"
                                            ? "border-[#22D3EE] bg-[#22D3EE]/10"
                                            : "border-[#333] hover:border-[#555]"
                                    }`}
                                >
                                    <Building2 className={`w-6 h-6 mx-auto mb-2 ${
                                        mode === "company" ? "text-[#22D3EE]" : "text-gray-400"
                                    }`} />
                                    <p className={`text-sm font-medium ${
                                        mode === "company" ? "text-white" : "text-gray-400"
                                    }`}>
                                        New Company
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">I'm an admin</p>
                                </button>
                                
                                <button
                                    onClick={() => setMode("employee")}
                                    className={`p-4 rounded-lg border transition-all ${
                                        mode === "employee"
                                            ? "border-[#22D3EE] bg-[#22D3EE]/10"
                                            : "border-[#333] hover:border-[#555]"
                                    }`}
                                >
                                    <User className={`w-6 h-6 mx-auto mb-2 ${
                                        mode === "employee" ? "text-[#22D3EE]" : "text-gray-400"
                                    }`} />
                                    <p className={`text-sm font-medium ${
                                        mode === "employee" ? "text-white" : "text-gray-400"
                                    }`}>
                                        Join Company
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">I'm an employee</p>
                                </button>
                            </div>

                            {/* Create Company Form */}
                            {mode === "company" && (
                                <div className="space-y-4 pt-4 border-t border-[#333]">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-300">Company Name *</label>
                                        <input
                                            type="text"
                                            value={companyName}
                                            onChange={(e) => setCompanyName(e.target.value)}
                                            placeholder="Acme Corporation"
                                            className="w-full h-10 px-3 rounded-md bg-black border border-[#333] text-white focus:outline-none focus:border-[#22D3EE] focus:ring-1 focus:ring-[#22D3EE] transition-all placeholder:text-gray-600"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-300">Company Slug *</label>
                                        <input
                                            type="text"
                                            value={companySlug}
                                            onChange={(e) => setCompanySlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                                            placeholder="acme-corp"
                                            className="w-full h-10 px-3 rounded-md bg-black border border-[#333] text-white focus:outline-none focus:border-[#22D3EE] focus:ring-1 focus:ring-[#22D3EE] transition-all placeholder:text-gray-600 font-mono text-sm"
                                        />
                                        <p className="text-xs text-gray-500">Used in URLs: reimburse.ai/{companySlug || "your-company"}</p>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-300">Company Email *</label>
                                        <input
                                            type="email"
                                            value={companyEmail}
                                            onChange={(e) => setCompanyEmail(e.target.value)}
                                            placeholder="admin@acme.com"
                                            className="w-full h-10 px-3 rounded-md bg-black border border-[#333] text-white focus:outline-none focus:border-[#22D3EE] focus:ring-1 focus:ring-[#22D3EE] transition-all placeholder:text-gray-600"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-300">Your Name *</label>
                                        <input
                                            type="text"
                                            value={employeeName}
                                            onChange={(e) => setEmployeeName(e.target.value)}
                                            placeholder="John Doe"
                                            className="w-full h-10 px-3 rounded-md bg-black border border-[#333] text-white focus:outline-none focus:border-[#22D3EE] focus:ring-1 focus:ring-[#22D3EE] transition-all placeholder:text-gray-600"
                                        />
                                    </div>

                                    <button
                                        onClick={handleCreateCompany}
                                        disabled={isSubmitting || !companyName || !companySlug || !companyEmail || !employeeName}
                                        className="w-full h-10 rounded-md bg-[#22D3EE] text-black font-medium hover:bg-[#22D3EE]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                        {isSubmitting ? (
                                            <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                                        ) : (
                                            <>
                                                Create Company
                                                <ArrowRight className="w-4 h-4" />
                                            </>
                                        )}
                                    </button>
                                </div>
                            )}

                            {/* Join Company Form */}
                            {mode === "employee" && (
                                <div className="space-y-4 pt-4 border-t border-[#333]">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-300">Company Code *</label>
                                        <input
                                            type="text"
                                            value={companyCode}
                                            onChange={(e) => setCompanyCode(e.target.value)}
                                            placeholder="Company ID or slug"
                                            className="w-full h-10 px-3 rounded-md bg-black border border-[#333] text-white focus:outline-none focus:border-[#22D3EE] focus:ring-1 focus:ring-[#22D3EE] transition-all placeholder:text-gray-600"
                                        />
                                        <p className="text-xs text-gray-500">Ask your admin for the company code</p>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-300">Your Name *</label>
                                        <input
                                            type="text"
                                            value={employeeName}
                                            onChange={(e) => setEmployeeName(e.target.value)}
                                            placeholder="John Doe"
                                            className="w-full h-10 px-3 rounded-md bg-black border border-[#333] text-white focus:outline-none focus:border-[#22D3EE] focus:ring-1 focus:ring-[#22D3EE] transition-all placeholder:text-gray-600"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-300">Your Email *</label>
                                        <input
                                            type="email"
                                            value={employeeEmail}
                                            onChange={(e) => setEmployeeEmail(e.target.value)}
                                            placeholder="you@company.com"
                                            className="w-full h-10 px-3 rounded-md bg-black border border-[#333] text-white focus:outline-none focus:border-[#22D3EE] focus:ring-1 focus:ring-[#22D3EE] transition-all placeholder:text-gray-600"
                                        />
                                    </div>

                                    <button
                                        onClick={handleJoinCompany}
                                        disabled={isSubmitting || !companyCode || !employeeName || !employeeEmail}
                                        className="w-full h-10 rounded-md bg-[#22D3EE] text-black font-medium hover:bg-[#22D3EE]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                        {isSubmitting ? (
                                            <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                                        ) : (
                                            <>
                                                Join Company
                                                <ArrowRight className="w-4 h-4" />
                                            </>
                                        )}
                                    </button>
                                </div>
                            )}
                        </>
                    )}

                    <div className="text-center text-sm text-gray-500">
                        Already have an account?{" "}
                        <Link href="/sign-in" className="text-[#22D3EE] hover:underline">
                            Sign in
                        </Link>
                    </div>
                </div>

                <p className="text-xs text-gray-500 text-center">
                    By signing up, you agree to our Terms of Service and Privacy Policy
                </p>
            </div>
        </div>
    );
}
