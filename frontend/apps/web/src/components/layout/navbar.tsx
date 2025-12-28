"use client";

import { Logo } from "@/components/brand/logo";
import { Bell, ChevronDown, Shield, User } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { thirdwebClient, chain } from "@/lib/thirdweb";
import { ConnectButton } from "thirdweb/react";

export function Navbar({
    persona,
}: {
    persona: "employee" | "manager";
}) {
    const { user } = useAuth();

    return (
        <header className="h-14 border-b border-[#333333] bg-black/50 backdrop-blur-md flex items-center justify-between px-4 sticky top-0 z-50">
            <div className="flex items-center gap-4">
                <Logo />
                <div className="h-6 w-[1px] bg-[#333333] hidden md:block" />
                <div className="hidden md:flex items-center gap-2 text-sm text-gray-400 hover:text-white cursor-pointer transition-colors">
                    <span>{user?.company?.name || "Company"}</span>
                    <ChevronDown className="w-4 h-4" />
                </div>
            </div>

            <div className="flex items-center gap-4">
                {/* Role Badge */}
                <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-[#111] border border-[#333] rounded-md">
                    {persona === "manager" ? (
                        <>
                            <Shield className="w-3.5 h-3.5 text-[#22D3EE]" />
                            <span className="text-xs font-medium text-[#22D3EE]">
                                {user?.isAdmin ? "Admin" : "Manager"}
                            </span>
                        </>
                    ) : (
                        <>
                            <User className="w-3.5 h-3.5 text-gray-400" />
                            <span className="text-xs font-medium text-gray-400">Employee</span>
                        </>
                    )}
                </div>

                <button className="text-gray-400 hover:text-white transition-colors">
                    <Bell className="w-5 h-5" />
                </button>
                
                {/* Wallet/User section */}
                <ConnectButton
                    client={thirdwebClient}
                    chain={chain}
                    detailsButton={{
                        style: {
                            backgroundColor: "#111",
                            border: "1px solid #333",
                            borderRadius: "8px",
                            padding: "4px 12px",
                            fontSize: "12px",
                        },
                    }}
                    connectButton={{
                        style: {
                            backgroundColor: "#22D3EE",
                            color: "#000",
                            fontWeight: "500",
                            padding: "8px 16px",
                            borderRadius: "8px",
                            fontSize: "12px",
                        },
                    }}
                />
            </div>
        </header>
    );
}
