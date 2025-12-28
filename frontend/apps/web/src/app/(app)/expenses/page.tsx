"use client";

import { useEffect, useState } from "react";
import { Clock, CheckCircle2, XCircle, AlertTriangle, Wallet, RefreshCw, Eye } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { receiptApi, type Receipt } from "@/lib/api";
import { toast } from "sonner";
import Link from "next/link";

const statusIcons: Record<string, typeof Clock> = {
    uploaded: Clock,
    processing: Clock,
    approved: CheckCircle2,
    rejected: XCircle,
    flagged: AlertTriangle,
    paid: Wallet,
};

const statusColors: Record<string, string> = {
    uploaded: "text-yellow-500",
    processing: "text-blue-500",
    approved: "text-green-500",
    rejected: "text-red-500",
    flagged: "text-orange-500",
    paid: "text-[#22D3EE]",
};

export default function ExpensesPage() {
    const { user } = useAuth();
    const [receipts, setReceipts] = useState<Receipt[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filter, setFilter] = useState<string>("all");
    const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null);

    useEffect(() => {
        if (user?.employee?.id) {
            fetchReceipts();
        }
    }, [user?.employee?.id, filter]);

    const fetchReceipts = async () => {
        if (!user?.employee?.id) return;
        
        setIsLoading(true);
        try {
            const status = filter !== "all" ? filter : undefined;
            const response = await receiptApi.listByEmployee(user.employee.id, 1, 50, status);
            
            if (response.success && response.data) {
                setReceipts((response.data as any).data || []);
            }
        } catch (error) {
            toast.error("Failed to load expenses");
        } finally {
            setIsLoading(false);
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));

        if (days === 0) {
            return `Today, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
        } else if (days === 1) {
            return `Yesterday, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
        } else {
            return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
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
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white tracking-tight">My Expenses</h1>
                    <p className="text-gray-400">Track the status of your reimbursement requests.</p>
                </div>
                <div className="flex items-center gap-3">
                    <select
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        className="h-9 px-3 rounded-lg bg-[#111] border border-[#333] text-sm text-white focus:outline-none focus:border-[#22D3EE]"
                    >
                        <option value="all">All Status</option>
                        <option value="uploaded">Uploaded</option>
                        <option value="processing">Processing</option>
                        <option value="approved">Approved</option>
                        <option value="flagged">Flagged</option>
                        <option value="paid">Paid</option>
                        <option value="rejected">Rejected</option>
                    </select>
                    <button
                        onClick={fetchReceipts}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#111] border border-[#333] text-gray-300 hover:text-white hover:border-[#22D3EE] transition-colors"
                    >
                        <RefreshCw className="w-4 h-4" />
                    </button>
                </div>
            </div>

            <div className="bg-[#111] border border-[#333] rounded-xl overflow-hidden">
                {receipts.length > 0 ? (
                    <div className="divide-y divide-[#333]">
                        {receipts.map((receipt) => {
                            const Icon = statusIcons[receipt.status] || Clock;
                            const color = statusColors[receipt.status] || "text-gray-500";
                            
                            return (
                                <div
                                    key={receipt.id}
                                    className="p-4 flex items-center justify-between hover:bg-[#1A1A1A] transition-colors group cursor-pointer"
                                    onClick={() => setSelectedReceipt(receipt)}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-full bg-[#0A0A0A] border border-[#333] flex items-center justify-center ${color}`}>
                                            <Icon className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-medium text-white">
                                                {receipt.merchant_name || "Processing..."}
                                            </h3>
                                            <p className="text-xs text-gray-500">{formatDate(receipt.created_at)}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="text-right">
                                            <span className="block text-sm font-bold text-white mb-1">
                                                ${receipt.amount?.toFixed(2) || "0.00"}
                                            </span>
                                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full bg-opacity-10 ${color.replace('text-', 'bg-')} ${color} capitalize`}>
                                                {receipt.status}
                                            </span>
                                        </div>
                                        <Eye className="w-4 h-4 text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="p-12 text-center">
                        <div className="w-16 h-16 rounded-full bg-[#1A1A1A] flex items-center justify-center mx-auto mb-4">
                            <Clock className="w-8 h-8 text-gray-500" />
                        </div>
                        <h3 className="text-lg font-medium text-white mb-2">No expenses yet</h3>
                        <p className="text-gray-500 mb-4">Upload your first receipt to get started</p>
                        <Link
                            href="/upload"
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#22D3EE] text-black font-medium hover:bg-[#22D3EE]/90 transition-colors"
                        >
                            Upload Receipt
                        </Link>
                    </div>
                )}
            </div>

            {/* Receipt Detail Modal */}
            {selectedReceipt && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => setSelectedReceipt(null)}>
                    <div className="bg-[#111] border border-[#333] rounded-xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-semibold text-white">Receipt Details</h2>
                            <button onClick={() => setSelectedReceipt(null)} className="text-gray-400 hover:text-white">
                                <XCircle className="w-5 h-5" />
                            </button>
                        </div>
                        
                        <div className="space-y-4">
                            <DetailRow label="Merchant" value={selectedReceipt.merchant_name || "Processing..."} />
                            <DetailRow label="Amount" value={`$${selectedReceipt.amount?.toFixed(2) || "0.00"}`} />
                            <DetailRow label="Status" value={selectedReceipt.status} capitalize />
                            <DetailRow label="Category" value={selectedReceipt.category || "Uncategorized"} />
                            <DetailRow label="Date" value={formatDate(selectedReceipt.created_at)} />
                            {selectedReceipt.description && (
                                <DetailRow label="Description" value={selectedReceipt.description} />
                            )}
                            {selectedReceipt.ai_confidence && (
                                <DetailRow label="AI Confidence" value={`${(selectedReceipt.ai_confidence * 100).toFixed(0)}%`} />
                            )}
                            {selectedReceipt.payout_tx_hash && (
                                <DetailRow label="Transaction" value={selectedReceipt.payout_tx_hash.slice(0, 16) + "..."} />
                            )}
                        </div>

                        {selectedReceipt.status === "flagged" && selectedReceipt.decision_reason && (
                            <div className="mt-4 p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
                                <p className="text-sm text-orange-400">
                                    <strong>Flag Reason:</strong> {selectedReceipt.decision_reason}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

function DetailRow({ label, value, capitalize = false }: { label: string; value: string; capitalize?: boolean }) {
    return (
        <div className="flex justify-between items-center py-2 border-b border-[#222]">
            <span className="text-sm text-gray-400">{label}</span>
            <span className={`text-sm font-medium text-white ${capitalize ? "capitalize" : ""}`}>{value}</span>
        </div>
    );
}
