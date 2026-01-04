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
  Download,
  FileSpreadsheet,
  Calendar,
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
    recipientAddress: "0x1234567890abcdef1234567890abcdef12345678",
    timestamp: "2024-01-15T10:30:15Z",
    txHash: "0xabc123def456789abc123def456789abc123def456789abc123def456789abc1",
    receiptUrl: "https://storage.reimburseai.app/receipts/receipt-001.jpg",
  },
  {
    id: "2",
    type: "payout",
    amount: 320.00,
    recipient: "Jane Smith",
    recipientAddress: "0x2345678901bcdef12345678901bcdef123456789",
    timestamp: "2024-01-14T16:45:10Z",
    txHash: "0xdef789ghi012345def789ghi012345def789ghi012345def789ghi012345def7",
    receiptUrl: "https://storage.reimburseai.app/receipts/receipt-002.jpg",
  },
  {
    id: "3",
    type: "deposit",
    amount: 5000.00,
    recipient: "Treasury",
    recipientAddress: "0x742d35Cc6634C0532925a3b844Bc454e4438f26e",
    timestamp: "2024-01-14T09:00:00Z",
    txHash: "0xghi345jkl678901ghi345jkl678901ghi345jkl678901ghi345jkl678901ghi3",
    receiptUrl: "",
  },
  {
    id: "4",
    type: "payout",
    amount: 156.78,
    recipient: "Bob Johnson",
    recipientAddress: "0x3456789012cdef123456789012cdef1234567890",
    timestamp: "2024-01-13T11:30:12Z",
    txHash: "0xjkl901mno234567jkl901mno234567jkl901mno234567jkl901mno234567jkl9",
    receiptUrl: "https://storage.reimburseai.app/receipts/receipt-003.jpg",
  },
];

// Export CSV utility function
function exportTransactionsToCSV(transactions: typeof demoRecentTransactions, month?: string) {
  // Filter to only payouts (reimbursements) for the report
  const payouts = transactions.filter(tx => tx.type === "payout");
  
  // CSV Headers as required for legal compliance
  const headers = [
    "Date",
    "Employee Address",
    "Amount (USDC)",
    "Transaction Hash",
    "Receipt Image URL",
  ];
  
  // Build CSV rows
  const rows = payouts.map(tx => [
    new Date(tx.timestamp).toISOString().split('T')[0], // Date in YYYY-MM-DD format
    tx.recipientAddress,
    tx.amount.toFixed(2),
    tx.txHash,
    tx.receiptUrl || "N/A",
  ]);
  
  // Combine headers and rows
  const csvContent = [
    headers.join(","),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
  ].join("\n");
  
  // Create and download the file
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  const filename = month 
    ? `reimburseai-report-${month}.csv` 
    : `reimburseai-report-${new Date().toISOString().slice(0, 7)}.csv`;
  
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export default function TreasuryPage() {
  const { user, isAdmin } = useAuth();
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [isExporting, setIsExporting] = useState(false);

  const copyAddress = () => {
    navigator.clipboard.writeText(demoTreasury.walletAddress);
    setCopiedAddress(true);
    setTimeout(() => setCopiedAddress(false), 2000);
  };

  const handleExport = () => {
    setIsExporting(true);
    // Simulate async export (in production, this would fetch real data)
    setTimeout(() => {
      exportTransactionsToCSV(demoRecentTransactions, selectedMonth);
      setIsExporting(false);
      setShowExportModal(false);
    }, 500);
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
      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md bg-navy-800 rounded-2xl border border-white/10 shadow-2xl overflow-hidden"
          >
            {/* Modal header */}
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-cyan-400/10 flex items-center justify-center">
                  <FileSpreadsheet className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Export Monthly Report</h3>
                  <p className="text-sm text-white/50">Download CSV for accounting</p>
                </div>
              </div>
            </div>

            {/* Modal content */}
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">
                  Select Month
                </label>
                <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                  <input
                    type="month"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-cyan-400/50"
                  />
                </div>
              </div>

              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                <p className="text-sm text-white/50 mb-2">Report will include:</p>
                <ul className="text-sm text-white/70 space-y-1">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-cyan-400" /> Date of transaction
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-cyan-400" /> Employee wallet address
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-cyan-400" /> Amount in USDC
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-cyan-400" /> Transaction hash (on-chain proof)
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-cyan-400" /> Link to receipt image
                  </li>
                </ul>
              </div>

              <p className="text-xs text-white/40">
                This report provides a complete audit trail for tax compliance and accounting purposes.
              </p>
            </div>

            {/* Modal footer */}
            <div className="flex items-center gap-3 p-6 border-t border-white/10 bg-white/[0.02]">
              <button
                onClick={() => setShowExportModal(false)}
                className="flex-1 btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleExport}
                disabled={isExporting}
                className="flex-1 btn-primary"
              >
                {isExporting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    Download CSV
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white">Treasury</h1>
          <p className="text-white/50 mt-1">
            Manage your company's USDC funds for reimbursements.
          </p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setShowExportModal(true)}
            className="btn-secondary"
            title="Export monthly report for accounting"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Export Data
          </button>
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
            {transaction.recipient} • {truncateAddress(transaction.recipientAddress)}
          </p>
        </div>
      </div>
      <div className="text-right flex items-center gap-4">
        <div>
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
        {transaction.txHash && (
          <a
            href={`https://testnet.snowtrace.io/tx/${transaction.txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 text-white/30 hover:text-cyan-400 transition-colors"
            title="View on Explorer"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        )}
      </div>
    </div>
  );
}
