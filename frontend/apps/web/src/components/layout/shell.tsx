"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "./navbar";
import { Sidebar } from "./sidebar";
import { useAuth } from "@/context/auth-context";

export function Shell({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const { isConnected, isLoading, user } = useAuth();

    // Determine persona from user role (managers and admins see manager view)
    const persona = user?.isManager ? "manager" : "employee";

    // Redirect to sign-in if not connected
    useEffect(() => {
        if (!isLoading && !isConnected) {
            router.push("/sign-in");
        }
    }, [isConnected, isLoading, router]);

    // Show loading while checking auth
    if (isLoading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-[#22D3EE] border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    // Don't render until we confirm user is connected
    if (!isConnected) {
        return null;
    }

    return (
        <div className="min-h-screen bg-black flex flex-col">
            <Navbar persona={persona} />
            <div className="flex flex-1">
                <Sidebar persona={persona} />
                <main className="flex-1 p-6 overflow-auto">{children}</main>
            </div>
        </div>
    );
}
