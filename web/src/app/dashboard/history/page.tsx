"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowUpRight,
  ArrowDownLeft,
  ExternalLink,
  Copy,
  Check,
  Filter,
  Search,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import { useProfile } from "@/hooks";
import { receiptApi, type Audit } from "@/lib/api";
import { formatCurrency, truncateAddress } from "@/lib/utils";

export default function HistoryPage() {
  const { employee, company } = useProfile();
  const isEmployee = Boolean(employee?.id);
  const [search, setSearch] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [audits, setAudits] = useState<Audit[]>([]);
  const [loading, setLoading] = useState(true);

  const loadAudits = useCallback(async () => {
    setLoading(true);
    try {
      const authz = isEmployee
        ? { accountType: "employee" as const }
        : { accountType: "company" as const };

      const response = isEmployee
        ? await receiptApi.getAuditationsByEmployee(authz)
        : await receiptApi.getAuditationsByCompany(authz);

      if (!response.success || !response.data) {
        throw new Error(response.error?.message || "Failed to load audits");
      }

      setAudits(response.data.filter((audit) => Boolean(audit.payout_tx_hash)));
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to load history",
      );
      setAudits([]);
    } finally {
      setLoading(false);
    }
  }, [
    company?.smart_wallet_address,
    employee?.smart_wallet_address,
    isEmployee,
  ]);

  useEffect(() => {
    if (isEmployee && !employee?.id) return;
    if (!isEmployee && !company?.id) return;
    loadAudits();
  }, [company?.id, employee?.id, isEmployee, loadAudits]);

  const totalPaidOut = audits.reduce(
    (sum, audit) => sum + Number(audit.payout_amount || audit.amount || 0),
    0,
  );

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredAudits = audits.filter((audit) => {
    const description = `${audit.merchant || "Expense"} reimbursement`;
    const txHash = audit.payout_tx_hash || "";

    return (
      description.toLowerCase().includes(search.toLowerCase()) ||
      txHash.toLowerCase().includes(search.toLowerCase())
    );
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-2 border-[#22D3EE] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-white">
          Transaction History
        </h1>
        <p className="text-white/50 mt-1">View all your USDC transactions.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-400/10 flex items-center justify-center">
              <ArrowDownLeft className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-white/50 text-sm">Total Received</p>
              <p className="text-2xl font-bold text-white">
                {formatCurrency(totalPaidOut)}
              </p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-cyan-400/10 flex items-center justify-center">
              <Wallet className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <p className="text-white/50 text-sm">Total Transactions</p>
              <p className="text-2xl font-bold text-white">{audits.length}</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-400/10 flex items-center justify-center">
              <ArrowUpRight className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <p className="text-white/50 text-sm">Network</p>
              <p className="text-2xl font-bold text-white">Sepolia</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by description or transaction hash..."
          className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-cyan-400/50"
        />
      </div>

      {/* Transactions list */}
      <div className="card overflow-hidden">
        <div className="hidden lg:grid grid-cols-12 gap-4 p-4 border-b border-white/10 text-white/40 text-sm font-medium">
          <div className="col-span-1">Type</div>
          <div className="col-span-4">Description</div>
          <div className="col-span-2">Amount</div>
          <div className="col-span-3">Transaction Hash</div>
          <div className="col-span-2 text-right">Date</div>
        </div>

        <div className="divide-y divide-white/5">
          {filteredAudits.length === 0 ? (
            <div className="p-12 text-center">
              <Wallet className="w-12 h-12 text-white/20 mx-auto mb-4" />
              <p className="text-white/50">No transactions found</p>
            </div>
          ) : (
            filteredAudits.map((audit) => (
              <TransactionRow
                key={audit.id}
                audit={audit}
                onCopy={copyToClipboard}
                copiedId={copiedId}
                companyWallet={company?.smart_wallet_address || ""}
                employeeWallet={employee?.smart_wallet_address || ""}
              />
            ))
          )}
        </div>
      </div>

      {/* View on explorer */}
      <div className="text-center">
        <a
          href="https://sepolia.celoscan.io/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors"
        >
          View all on Block Explorer
          <ExternalLink className="w-4 h-4" />
        </a>
      </div>
    </div>
  );
}

function TransactionRow({
  audit,
  onCopy,
  copiedId,
  companyWallet,
  employeeWallet,
}: {
  audit: Audit;
  onCopy: (text: string, id: string) => void;
  copiedId: string | null;
  companyWallet: string;
  employeeWallet: string;
}) {
  const isCopied = copiedId === audit.id;
  const txHash = audit.payout_tx_hash || "";
  const amount = Number(audit.payout_amount || audit.amount || 0);
  const from = companyWallet;
  const to = audit.payout_wallet || employeeWallet;
  const timestamp = audit.paid_at || audit.created_at;
  const description = `${audit.merchant || "Expense"} reimbursement`;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 p-4 hover:bg-white/[0.02] transition-colors">
      {/* Type */}
      <div className="lg:col-span-1 flex items-center">
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center ${"bg-emerald-400/10 text-emerald-400"}`}
        >
          <ArrowDownLeft className="w-4 h-4" />
        </div>
      </div>

      {/* Description */}
      <div className="lg:col-span-4 flex items-center">
        <div>
          <p className="text-white font-medium">{description}</p>
          <p className="text-white/40 text-sm">
            From: {from ? truncateAddress(from) : "-"} →{" "}
            {to ? truncateAddress(to) : "-"}
          </p>
        </div>
      </div>

      {/* Amount */}
      <div className="lg:col-span-2 flex items-center">
        <div className="lg:hidden text-white/40 text-sm w-24">Amount</div>
        <p className="text-emerald-400 font-medium">
          +{formatCurrency(amount)} USDC
        </p>
      </div>

      {/* Transaction hash */}
      <div className="lg:col-span-3 flex items-center gap-2">
        <div className="lg:hidden text-white/40 text-sm w-24">Tx Hash</div>
        <code className="text-white/50 text-sm font-mono">{txHash}</code>
        <button
          onClick={() => onCopy(txHash, audit.id)}
          className="p-1 text-white/30 hover:text-white transition-colors"
        >
          {isCopied ? (
            <Check className="w-4 h-4 text-emerald-400" />
          ) : (
            <Copy className="w-4 h-4" />
          )}
        </button>
        <a
          href={`https://testnet.snowtrace.io/tx/${txHash}`}
          target="_blank"
          rel="noopener noreferrer"
          className="p-1 text-white/30 hover:text-cyan-400 transition-colors"
        >
          <ExternalLink className="w-4 h-4" />
        </a>
      </div>

      {/* Date */}
      <div className="lg:col-span-2 flex items-center justify-end">
        <div className="lg:hidden text-white/40 text-sm w-24">Date</div>
        <p className="text-white/50 text-sm">
          {new Date(timestamp).toLocaleString()}
        </p>
      </div>
    </div>
  );
}
