"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  Plus,
  Send,
  RefreshCw,
  ExternalLink,
  Copy,
  Check,
  TrendingUp,
  Clock,
  Shield,
} from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { formatCurrency, truncateAddress } from "@/lib/utils";

// Demo data
const demoTreasury = {
  balance: 15000.00,
  pendingPayouts: 1250.00,
  totalPaidOut: 45750.00,
  walletAddress: "0x742d35Cc6634C0532925a3b844Bc454e4438f26e",
};

const demoRecentTransactions = [
  {
    id: "1",
    type: "payout",
    amount: 450.00,
    recipient: "John Doe",
    recipientAddress: "0x1234...5678",
    timestamp: "2024-01-15T10:30:15Z",
  },
  {
    id: "2",
    type: "payout",
    amount: 320.00,
    recipient: "Jane Smith",
    recipientAddress: "0x2345...6789",
    timestamp: "2024-01-14T16:45:10Z",
  },
  {
    id: "3",
    type: "deposit",
    amount: 5000.00,
    recipient: "Treasury",
    recipientAddress: demoTreasury.walletAddress,
    timestamp: "2024-01-14T09:00:00Z",
  },
  {
    id: "4",
    type: "payout",
    amount: 156.78,
    recipient: "Bob Johnson",
    recipientAddress: "0x3456...7890",
    timestamp: "2024-01-13T11:30:12Z",
  },
];

export default function TreasuryPage() {
  const { user, isAdmin } = useAuth();
  const [copiedAddress, setCopiedAddress] = useState(false);

  const copyAddress = () => {
    navigator.clipboard.writeText(demoTreasury.walletAddress);
    setCopiedAddress(true);
    setTimeout(() => setCopiedAddress(false), 2000);
  };

  // Only admins can access treasury
  if (user?.employee?.role !== "admin" && !isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Shield className="w-12 h-12 text-white/20 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">
            Access Restricted
          </h2>
          <p className="text-white/50">
            Only company admins can access the treasury.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white">Treasury</h1>
          <p className="text-white/50 mt-1">
            Manage your company's USDC funds for reimbursements.
          </p>
        </div>
        <div className="flex gap-3">
          <button className="btn-secondary">
            <Send className="w-4 h-4" />
            Withdraw
          </button>
          <button className="btn-primary">
            <Plus className="w-4 h-4" />
            Add Funds
          </button>
        </div>
      </div>

      {/* Wallet card */}
      <div className="card bg-gradient-to-br from-cyan-400/10 to-purple-400/10 border-cyan-400/20">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <p className="text-white/50 text-sm mb-2">Treasury Balance</p>
            <p className="text-4xl lg:text-5xl font-bold text-white">
              {formatCurrency(demoTreasury.balance)}
              <span className="text-xl text-white/50 ml-2">USDC</span>
            </p>
            <div className="flex items-center gap-2 mt-4">
              <code className="text-white/50 text-sm font-mono">
                {truncateAddress(demoTreasury.walletAddress)}
              </code>
              <button
                onClick={copyAddress}
                className="p-1 text-white/30 hover:text-white transition-colors"
              >
                {copiedAddress ? (
                  <Check className="w-4 h-4 text-emerald-400" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
              <a
                href={`https://testnet.snowtrace.io/address/${demoTreasury.walletAddress}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1 text-white/30 hover:text-cyan-400 transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>
          <div className="flex flex-wrap gap-4">
            <div className="px-6 py-4 rounded-xl bg-white/5">
              <div className="flex items-center gap-2 text-amber-400 mb-1">
                <Clock className="w-4 h-4" />
                <span className="text-sm">Pending Payouts</span>
              </div>
              <p className="text-2xl font-bold text-white">
                {formatCurrency(demoTreasury.pendingPayouts)}
              </p>
            </div>
            <div className="px-6 py-4 rounded-xl bg-white/5">
              <div className="flex items-center gap-2 text-emerald-400 mb-1">
                <TrendingUp className="w-4 h-4" />
                <span className="text-sm">Total Paid Out</span>
              </div>
              <p className="text-2xl font-bold text-white">
                {formatCurrency(demoTreasury.totalPaidOut)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-cyan-400/10 flex items-center justify-center">
              <Wallet className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <p className="text-white/50 text-sm">Network</p>
              <p className="text-lg font-semibold text-white">
                Avalanche Fuji
              </p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-400/10 flex items-center justify-center">
              <RefreshCw className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <p className="text-white/50 text-sm">Avg. Payout Time</p>
              <p className="text-lg font-semibold text-white">~3 seconds</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-400/10 flex items-center justify-center">
              <Shield className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-white/50 text-sm">Security</p>
              <p className="text-lg font-semibold text-white">
                Multi-sig Ready
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent transactions */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-white">
            Recent Transactions
          </h2>
          <a
            href="/dashboard/history"
            className="text-cyan-400 text-sm hover:text-cyan-300 transition-colors"
          >
            View all →
          </a>
        </div>

        <div className="space-y-4">
          {demoRecentTransactions.map((tx) => (
            <TransactionRow key={tx.id} transaction={tx} />
          ))}
        </div>
      </div>
    </div>
  );
}

function TransactionRow({
  transaction,
}: {
  transaction: (typeof demoRecentTransactions)[0];
}) {
  return (
    <div className="flex items-center justify-between p-4 rounded-lg bg-white/[0.02] border border-white/5">
      <div className="flex items-center gap-4">
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center ${
            transaction.type === "deposit"
              ? "bg-emerald-400/10 text-emerald-400"
              : "bg-purple-400/10 text-purple-400"
          }`}
        >
          {transaction.type === "deposit" ? (
            <ArrowDownLeft className="w-5 h-5" />
          ) : (
            <ArrowUpRight className="w-5 h-5" />
          )}
        </div>
        <div>
          <p className="text-white font-medium">
            {transaction.type === "deposit" ? "Deposit" : "Payout"}
          </p>
          <p className="text-white/40 text-sm">
            {transaction.recipient} • {transaction.recipientAddress}
          </p>
        </div>
      </div>
      <div className="text-right">
        <p
          className={`font-medium ${
            transaction.type === "deposit"
              ? "text-emerald-400"
              : "text-purple-400"
          }`}
        >
          {transaction.type === "deposit" ? "+" : "-"}
          {formatCurrency(transaction.amount)} USDC
        </p>
        <p className="text-white/40 text-xs">
          {new Date(transaction.timestamp).toLocaleString()}
        </p>
      </div>
    </div>
  );
}
