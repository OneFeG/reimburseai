import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Providers } from "@/components/providers";
import { Toaster } from "sonner";
import "./globals.css";

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

export const metadata: Metadata = {
    title: "Reimburse AI",
    description: "AI-powered reimbursement platform with instant USDC payouts",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" className="dark">
            <body
                className={`${geistSans.variable} ${geistMono.variable} antialiased bg-black text-white selection:bg-cyan-500/30`}
            >
                <Providers>
                    {children}
                    <Toaster
                        theme="dark"
                        position="bottom-right"
                        toastOptions={{
                            style: {
                                background: "#111",
                                border: "1px solid #333",
                                color: "#fff",
                            },
                        }}
                    />
                </Providers>
            </body>
        </html>
    );
}
