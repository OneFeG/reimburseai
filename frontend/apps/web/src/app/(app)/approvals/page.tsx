"use client";

import { useState, useEffect } from "react";
import { X, Check, AlertTriangle, ExternalLink, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/auth-context";
import { receiptApi, type Receipt } from "@/lib/api";
import { toast } from "sonner";
import Link from "next/link";

export default function ApprovalsPage() {
    const { user } = useAuth();
    const [receipts, setReceipts] = useState<Receipt[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        if (user?.company?.id) {
            fetchPendingReceipts();
        }
    }, [user?.company?.id]);

    const fetchPendingReceipts = async () => {
        if (!user?.company?.id) return;
        
        setIsLoading(true);
        try {
            const response = await receiptApi.getPending(user.company.id);
            if (response.success && response.data) {
                setReceipts(response.data.data || []);
            }
        } catch (error) {
            toast.error("Failed to load pending receipts");
        } finally {
            setIsLoading(false);
        }
    };

    const handleApprove = async (receiptId: string) => {
        setIsProcessing(true);
        try {
            const response = await receiptApi.updateStatus(receiptId, "approved");
            if (response.success) {
                toast.success("Receipt approved!");
                setSelectedReceipt(null);
                fetchPendingReceipts();
            } else {
                throw new Error(response.error?.message || "Failed to approve");
            }
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to approve receipt");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleReject = async (receiptId: string) => {
        setIsProcessing(true);
        try {
            const response = await receiptApi.updateStatus(receiptId, "rejected");
            if (response.success) {
                toast.success("Receipt rejected");
                setSelectedReceipt(null);
                fetchPendingReceipts();
            } else {
                throw new Error(response.error?.message || "Failed to reject");
            }
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to reject receipt");
        } finally {
            setIsProcessing(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="w-8 h-8 border-2 border-[#22D3EE] border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="relative h-full">
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-white tracking-tight">Approvals Queue</h1>
                        <p className="text-gray-400">Review flagged receipts and AI audit results.</p>
                    </div>
                    <button
                        onClick={fetchPendingReceipts}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#111] border border-[#333] text-gray-300 hover:text-white hover:border-[#22D3EE] transition-colors"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Refresh
                    </button>
                </div>

                <div className="bg-[#111] border border-[#333] rounded-xl overflow-hidden">
                    {receipts.length > 0 ? (
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-gray-500 uppercase bg-[#0A0A0A] border-b border-[#333]">
                                <tr>
                                    <th className="px-6 py-3">Employee</th>
                                    <th className="px-6 py-3">Merchant</th>
                                    <th className="px-6 py-3">Amount</th>
                                    <th className="px-6 py-3">Status</th>
                                    <th className="px-6 py-3">Confidence</th>
                                    <th className="px-6 py-3">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#333]">
                                {receipts.map((receipt) => (
                                    <tr
                                        key={receipt.id}
                                        className="hover:bg-[#1A1A1A] transition-colors cursor-pointer"
                                        onClick={() => setSelectedReceipt(receipt)}
                                    >
                                        <td className="px-6 py-4 font-medium text-white">
                                            {receipt.employee_id.slice(0, 8)}...
                                        </td>
                                        <td className="px-6 py-4 text-gray-300">
                                            {receipt.merchant_name || "Processing..."}
                                        </td>
                                        <td className="px-6 py-4 text-white font-medium">
                                            ${receipt.amount?.toFixed(2) || "0.00"}
                                        </td>
                                        <td className="px-6 py-4">
                                            <StatusBadge status={receipt.status} reason={receipt.decision_reason} />
                                        </td>
                                        <td className="px-6 py-4 text-gray-400">
                                            {receipt.ai_confidence ? `${(receipt.ai_confidence * 100).toFixed(0)}%` : "N/A"}
                                        </td>
                                        <td className="px-6 py-4">
                                            <button className="text-[#22D3EE] hover:underline text-xs font-medium">
                                                Review
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div className="p-12 text-center">
                            <div className="w-16 h-16 rounded-full bg-[#1A1A1A] flex items-center justify-center mx-auto mb-4">
                                <Check className="w-8 h-8 text-green-500" />
                            </div>
                            <h3 className="text-lg font-medium text-white mb-2">All caught up!</h3>
                            <p className="text-gray-500">No pending receipts require review.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Side Drawer */}
            <AnimatePresence>
                {selectedReceipt && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedReceipt(null)}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
                        />
                        <motion.div
                            initial={{ x: "100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-[#0A0A0A] border-l border-[#333] z-50 shadow-2xl flex flex-col"
                        >
                            <div className="p-6 border-b border-[#333] flex items-center justify-between bg-[#111]">
                                <h2 className="text-lg font-bold text-white">Audit Review</h2>
                                <button
                                    onClick={() => setSelectedReceipt(null)}
                                    className="text-gray-400 hover:text-white transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                                {/* Receipt Image Placeholder */}
                                <div className="aspect-[3/4] bg-[#111] rounded-lg border border-[#333] flex items-center justify-center relative overflow-hidden group">
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                    <span className="text-gray-500 text-sm">Receipt Image Preview</span>
                                </div>

                                {/* AI Analysis */}
                                <div className="space-y-4">
                                    <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider">AI Analysis</h3>

                                    {selectedReceipt.status === "flagged" && selectedReceipt.decision_reason && (
                                        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                                            <div className="flex items-start gap-3">
                                                <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                                                <div>
                                                    <h4 className="text-sm font-bold text-red-500">Policy Concern Detected</h4>
                                                    <p className="text-sm text-red-400/80 mt-1">{selectedReceipt.decision_reason}</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-3 bg-[#111] rounded-lg border border-[#333]">
                                            <span className="text-xs text-gray-500 block">Merchant</span>
                                            <span className="text-sm font-medium text-white">{selectedReceipt.merchant_name || "Unknown"}</span>
                                        </div>
                                        <div className="p-3 bg-[#111] rounded-lg border border-[#333]">
                                            <span className="text-xs text-gray-500 block">Total</span>
                                            <span className="text-sm font-medium text-white">${selectedReceipt.amount?.toFixed(2) || "0.00"}</span>
                                        </div>
                                        <div className="p-3 bg-[#111] rounded-lg border border-[#333]">
                                            <span className="text-xs text-gray-500 block">Date</span>
                                            <span className="text-sm font-medium text-white">
                                                {selectedReceipt.transaction_date 
                                                    ? new Date(selectedReceipt.transaction_date).toLocaleDateString()
                                                    : new Date(selectedReceipt.created_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <div className="p-3 bg-[#111] rounded-lg border border-[#333]">
                                            <span className="text-xs text-gray-500 block">Confidence</span>
                                            <span className="text-sm font-medium text-[#22D3EE]">
                                                {selectedReceipt.ai_confidence ? `${(selectedReceipt.ai_confidence * 100).toFixed(0)}%` : "N/A"}
                                            </span>
                                        </div>
                                    </div>

                                    {selectedReceipt.category && (
                                        <div className="p-3 bg-[#111] rounded-lg border border-[#333]">
                                            <span className="text-xs text-gray-500 block">Category</span>
                                            <span className="text-sm font-medium text-white capitalize">{selectedReceipt.category}</span>
                                        </div>
                                    )}

                                    {selectedReceipt.description && (
                                        <div className="p-3 bg-[#111] rounded-lg border border-[#333]">
                                            <span className="text-xs text-gray-500 block">Description</span>
                                            <span className="text-sm font-medium text-white">{selectedReceipt.description}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="p-6 border-t border-[#333] bg-[#111] flex gap-3">
                                <button 
                                    onClick={() => handleReject(selectedReceipt.id)}
                                    disabled={isProcessing}
                                    className="flex-1 h-10 rounded-md bg-red-500/10 text-red-500 font-medium border border-red-500/20 hover:bg-red-500/20 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {isProcessing ? (
                                        <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            <X className="w-4 h-4" /> Reject
                                        </>
                                    )}
                                </button>
                                <button 
                                    onClick={() => handleApprove(selectedReceipt.id)}
                                    disabled={isProcessing}
                                    className="flex-1 h-10 rounded-md bg-[#22D3EE] text-black font-medium hover:bg-[#22D3EE]/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {isProcessing ? (
                                        <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            <Check className="w-4 h-4" /> Approve
                                        </>
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}

function StatusBadge({ status, reason }: { status: string; reason?: string }) {
    if (status === "flagged" && reason) {
        return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-500/10 text-red-500 border border-red-500/20 max-w-[200px] truncate">
                <AlertTriangle className="w-3 h-3 shrink-0" />
                <span className="truncate">{reason}</span>
            </span>
        );
    }

    const styles: Record<string, string> = {
        uploaded: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
        processing: "bg-blue-500/10 text-blue-500 border-blue-500/20",
        flagged: "bg-red-500/10 text-red-500 border-red-500/20",
    };

    return (
        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border capitalize ${styles[status] || styles.uploaded}`}>
            {status}
        </span>
    );
}
