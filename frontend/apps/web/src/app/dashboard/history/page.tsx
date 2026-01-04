"use client";

import { useState } from "react";
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
import { formatCurrency, truncateAddress } from "@/lib/utils";

// Demo transaction data
const demoTransactions = [
  {
    id: "tx-001",
    type: "payout",
    amount: 450.00,
    description: "United Airlines reimbursement",
    from: "0x742d...8f26",
    to: "0xYOUR...ADDR",
    txHash: "0xabc123...def456",
    timestamp: "2024-01-15T10:30:15Z",
    status: "confirmed",
  },
  {
    id: "tx-002",
    type: "payout",
    amount: 320.00,
    description: "Hilton Hotels reimbursement",
    from: "0x742d...8f26",
    to: "0xYOUR...ADDR",
    txHash: "0xdef789...ghi012",
    timestamp: "2024-01-14T16:45:10Z",
    status: "confirmed",
  },
  {
    id: "tx-003",
    type: "payout",
    amount: 28.00,
    description: "Starbucks reimbursement",
    from: "0x742d...8f26",
    to: "0xYOUR...ADDR",
    txHash: "0xjkl345...mno678",
    timestamp: "2024-01-13T08:00:08Z",
    status: "confirmed",
  },
  {
    id: "tx-004",
    type: "payout",
    amount: 156.78,
    description: "Office Depot reimbursement",
    from: "0x742d...8f26",
    to: "0xYOUR...ADDR",
    txHash: "0xpqr901...stu234",
    timestamp: "2024-01-11T11:30:12Z",
    status: "confirmed",
  },
  {
    id: "tx-005",
    type: "payout",
    amount: 385.00,
    description: "Delta Airlines reimbursement",
    from: "0x742d...8f26",
    to: "0xYOUR...ADDR",
    txHash: "0xvwx567...yza890",
    timestamp: "2024-01-10T09:00:09Z",
    status: "confirmed",
  },
];

export default function HistoryPage() {
  const [search, setSearch] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const totalPaidOut = demoTransactions.reduce((sum, tx) => sum + tx.amount, 0);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredTransactions = demoTransactions.filter(
    (tx) =>
      tx.description.toLowerCase().includes(search.toLowerCase()) ||
      tx.txHash.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-white">
          Transaction History
        </h1>
        <p className="text-white/50 mt-1">
          View all your USDC transactions on Avalanche.
        </p>
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
              <p className="text-2xl font-bold text-white">
                {demoTransactions.length}
              </p>
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
              <p className="text-2xl font-bold text-white">Avalanche</p>
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
          {filteredTransactions.length === 0 ? (
            <div className="p-12 text-center">
              <Wallet className="w-12 h-12 text-white/20 mx-auto mb-4" />
              <p className="text-white/50">No transactions found</p>
            </div>
          ) : (
            filteredTransactions.map((tx) => (
              <TransactionRow
                key={tx.id}
                transaction={tx}
                onCopy={copyToClipboard}
                copiedId={copiedId}
              />
            ))
          )}
        </div>
      </div>

      {/* View on explorer */}
      <div className="text-center">
        <a
          href="https://testnet.snowtrace.io"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors"
        >
          View all on Snowtrace Explorer
          <ExternalLink className="w-4 h-4" />
        </a>
      </div>
    </div>
  );
}

function TransactionRow({
  transaction,
  onCopy,
  copiedId,
}: {
  transaction: (typeof demoTransactions)[0];
  onCopy: (text: string, id: string) => void;
  copiedId: string | null;
}) {
  const isCopied = copiedId === transaction.id;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 p-4 hover:bg-white/[0.02] transition-colors">
      {/* Type */}
      <div className="lg:col-span-1 flex items-center">
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center ${
            transaction.type === "payout"
              ? "bg-emerald-400/10 text-emerald-400"
              : "bg-red-400/10 text-red-400"
          }`}
        >
          {transaction.type === "payout" ? (
            <ArrowDownLeft className="w-4 h-4" />
          ) : (
            <ArrowUpRight className="w-4 h-4" />
          )}
        </div>
      </div>

      {/* Description */}
      <div className="lg:col-span-4 flex items-center">
        <div>
          <p className="text-white font-medium">{transaction.description}</p>
          <p className="text-white/40 text-sm">
            From: {transaction.from} → {transaction.to}
          </p>
        </div>
      </div>

      {/* Amount */}
      <div className="lg:col-span-2 flex items-center">
        <div className="lg:hidden text-white/40 text-sm w-24">Amount</div>
        <p className="text-emerald-400 font-medium">
          +{formatCurrency(transaction.amount)} USDC
        </p>
      </div>

      {/* Transaction hash */}
      <div className="lg:col-span-3 flex items-center gap-2">
        <div className="lg:hidden text-white/40 text-sm w-24">Tx Hash</div>
        <code className="text-white/50 text-sm font-mono">
          {transaction.txHash}
        </code>
        <button
          onClick={() => onCopy(transaction.txHash, transaction.id)}
          className="p-1 text-white/30 hover:text-white transition-colors"
        >
          {isCopied ? (
            <Check className="w-4 h-4 text-emerald-400" />
          ) : (
            <Copy className="w-4 h-4" />
          )}
        </button>
        <a
          href={`https://testnet.snowtrace.io/tx/${transaction.txHash}`}
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
          {new Date(transaction.timestamp).toLocaleString()}
        </p>
      </div>
    </div>
  );
}
