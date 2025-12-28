"use client";

import { Logo } from "@/components/brand/logo";
import { useAuth } from "@/context/auth-context";
import { thirdwebClient, chain, supportedWallets } from "@/lib/thirdweb";
import { ConnectButton } from "thirdweb/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Wallet, Shield, Zap, Mail, Chrome } from "lucide-react";
import Link from "next/link";

export default function SignInPage() {
    const { isConnected, user, isLoading } = useAuth();
    const router = useRouter();

    // Redirect to dashboard if already connected
    useEffect(() => {
        if (isConnected && user?.employee) {
            router.push("/dashboard");
        }
    }, [isConnected, user, router]);

    return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-md space-y-8">
                <div className="flex flex-col items-center text-center">
                    <Logo className="mb-6 scale-125" />
                    <h2 className="text-2xl font-bold text-white tracking-tight">
                        Welcome Back
                    </h2>
                    <p className="text-gray-400 mt-2">
                        Sign in with email, social, or wallet
                    </p>
                </div>

                <div className="bg-[#111] border border-[#333] rounded-xl p-8 space-y-6 shadow-2xl">
                    {/* Login Methods */}
                    <div className="space-y-3">
                        <Feature
                            icon={<Mail className="w-4 h-4 text-[#22D3EE]" />}
                            text="Email login (no password needed)"
                        />
                        <Feature
                            icon={<Chrome className="w-4 h-4 text-[#22D3EE]" />}
                            text="Google, Apple, Facebook sign-in"
                        />
                        <Feature
                            icon={<Wallet className="w-4 h-4 text-[#22D3EE]" />}
                            text="MetaMask & browser wallets"
                        />
                        <Feature
                            icon={<Zap className="w-4 h-4 text-[#22D3EE]" />}
                            text="Instant USDC payouts to your wallet"
                        />
                    </div>

                    <div className="border-t border-[#333] pt-6">
                        {isLoading ? (
                            <div className="flex items-center justify-center py-4">
                                <div className="w-6 h-6 border-2 border-[#22D3EE] border-t-transparent rounded-full animate-spin" />
                            </div>
                        ) : (
                            <div className="flex justify-center">
                                <ConnectButton
                                    client={thirdwebClient}
                                    chain={chain}
                                    wallets={supportedWallets}
                                    connectModal={{
                                        size: "wide",
                                        title: "Sign In to Reimburse AI",
                                        titleIcon: "",
                                        showThirdwebBranding: false,
                                    }}
                                    connectButton={{
                                        label: "Sign In",
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
                        )}
                    </div>

                    {/* New user message */}
                    {isConnected && !user?.employee && !isLoading && (
                        <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-4">
                            <p className="text-sm text-orange-400 text-center">
                                Your account is not linked to any company. Contact your admin or{" "}
                                <Link href="/sign-up" className="underline hover:text-orange-300">
                                    register your company
                                </Link>
                                .
                            </p>
                        </div>
                    )}

                    <div className="text-center text-sm text-gray-500">
                        New to Reimburse AI?{" "}
                        <Link href="/sign-up" className="text-[#22D3EE] hover:underline">
                            Register your company
                        </Link>
                    </div>
                </div>

                {/* Security note */}
                <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
                    <Shield className="w-3.5 h-3.5" />
                    <span>Secure, non-custodial authentication</span>
                </div>

                <p className="text-xs text-gray-500 text-center">
                    By connecting, you agree to our Terms of Service and Privacy Policy
                </p>
            </div>
        </div>
    );
}

function Feature({ icon, text }: { icon: React.ReactNode; text: string }) {
    return (
        <div className="flex items-center gap-3 text-sm text-gray-300">
            <div className="p-1.5 rounded-md bg-[#22D3EE]/10">{icon}</div>
            {text}
        </div>
    );
}
