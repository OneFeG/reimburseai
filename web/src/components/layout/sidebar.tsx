"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    Settings,
    Upload,
    List,
    CheckSquare,
    BookOpen,
    Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarProps {
    persona: "employee" | "manager";
}

export function Sidebar({ persona }: SidebarProps) {
    const pathname = usePathname();

    // Employee links - always visible
    const employeeLinks = [
        { href: "/upload", label: "Upload Receipt", icon: Upload },
        { href: "/expenses", label: "My Expenses", icon: List },
    ];

    // Manager/Admin only links
    const managerLinks = [
        { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
        { href: "/approvals", label: "Approvals", icon: CheckSquare },
        { href: "/ledger", label: "Ledger", icon: BookOpen },
        { href: "/settings", label: "Policy Settings", icon: Settings },
        { href: "/kyb", label: "Verification", icon: Shield },
    ];

    return (
        <aside className="w-64 border-r border-[#333333] bg-black hidden md:flex flex-col h-[calc(100vh-3.5rem)] sticky top-14">
            <div className="p-4 flex flex-col gap-1">
                {/* Employee section - always visible */}
                <div className="text-xs font-medium text-gray-500 mb-2 px-3 uppercase tracking-wider">
                    Expenses
                </div>
                {employeeLinks.map((link) => {
                    const Icon = link.icon;
                    const isActive = pathname === link.href;
                    return (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={cn(
                                "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200",
                                isActive
                                    ? "bg-[#22D3EE]/10 text-[#22D3EE] border border-[#22D3EE]/20"
                                    : "text-gray-400 hover:text-white hover:bg-[#111]"
                            )}
                        >
                            <Icon className="w-4 h-4" />
                            {link.label}
                        </Link>
                    );
                })}

                {/* Manager/Admin section - only for managers */}
                {persona === "manager" && (
                    <>
                        <div className="text-xs font-medium text-gray-500 mb-2 mt-6 px-3 uppercase tracking-wider">
                            Management
                        </div>
                        {managerLinks.map((link) => {
                            const Icon = link.icon;
                            const isActive = pathname === link.href;
                            return (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className={cn(
                                        "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200",
                                        isActive
                                            ? "bg-[#22D3EE]/10 text-[#22D3EE] border border-[#22D3EE]/20"
                                            : "text-gray-400 hover:text-white hover:bg-[#111]"
                                    )}
                                >
                                    <Icon className="w-4 h-4" />
                                    {link.label}
                                </Link>
                            );
                        })}
                    </>
                )}
            </div>
        </aside>
    );
}
