"use client";

import { useEffect, useState } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Wallet,
  Receipt,
  Clock,
  CheckCircle2,
  XCircle,
  RefreshCw,
  ExternalLink,
  DollarSign,
  TrendingUp,
} from "lucide-react";
import { useProfile } from "@/hooks";
import {
  ledgerApi,
  type LedgerEntry,
  type LedgerSummary,
  type LedgerEntryType,
  type LedgerEntryStatus,
} from "@/lib/api";
import { toast } from "sonner";

const typeIcons: Record<LedgerEntryType, typeof ArrowUpRight> = {
  payout: ArrowUpRight,
  advance: ArrowDownLeft,
  fee: DollarSign,
  deposit: Wallet,
};

const typeColors: Record<LedgerEntryType, string> = {
  payout: "text-green-500",
  advance: "text-blue-500",
  fee: "text-orange-500",
  deposit: "text-[#22D3EE]",
};

const statusIcons: Record<LedgerEntryStatus, typeof Clock> = {
  pending: Clock,
  processing: Clock,
  settled: CheckCircle2,
  failed: XCircle,
  cancelled: XCircle,
};

const statusColors: Record<LedgerEntryStatus, string> = {
  pending: "text-yellow-500 bg-yellow-500/10 border-yellow-500/20",
  processing: "text-blue-500 bg-blue-500/10 border-blue-500/20",
  settled: "text-green-500 bg-green-500/10 border-green-500/20",
  failed: "text-red-500 bg-red-500/10 border-red-500/20",
  cancelled: "text-gray-500 bg-gray-500/10 border-gray-500/20",
};

export default function LedgerPage() {
  const { employee, company } = useProfile();
  const user = { employee, company };
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [summary, setSummary] = useState<LedgerSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<{
    type?: LedgerEntryType;
    status?: LedgerEntryStatus;
  }>({});

  useEffect(() => {
    if (user?.company?.id) {
      fetchLedgerData();
    }
  }, [user?.company?.id, filter]);

  const fetchLedgerData = async () => {
    if (!user?.company?.id) return;

    setIsLoading(true);
    try {
      const [entriesResponse, summaryResponse] = await Promise.all([
        ledgerApi.getByCompany(
          user.company.id,
          100,
          0,
          filter.type,
          filter.status,
        ),
        ledgerApi.getSummary(user.company.id),
      ]);

      if (entriesResponse.success) {
        setEntries(entriesResponse.data || []);
      }
      if (summaryResponse.success) {
        setSummary(summaryResponse.data || null);
      }
    } catch (error) {
      toast.error("Failed to load ledger data");
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString([], {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatAmount = (amount: number, type: LedgerEntryType) => {
    const prefix = type === "payout" ? "-" : type === "deposit" ? "+" : "";
    return `${prefix}$${amount.toFixed(2)}`;
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
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Financial Ledger
          </h1>
          <p className="text-gray-400">
            Track all financial transactions and balances.
          </p>
        </div>
        <button
          onClick={fetchLedgerData}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#111] border border-[#333] text-gray-300 hover:text-white hover:border-[#22D3EE] transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <SummaryCard
            title="Total Payouts"
            value={`$${summary.total_payouts.toLocaleString()}`}
            icon={<ArrowUpRight className="w-5 h-5 text-green-500" />}
            subtitle={`${summary.entry_count} transactions`}
          />
          <SummaryCard
            title="Total Advances"
            value={`$${summary.total_advances.toLocaleString()}`}
            icon={<ArrowDownLeft className="w-5 h-5 text-blue-500" />}
          />
          <SummaryCard
            title="Platform Fees"
            value={`$${summary.total_fees.toFixed(2)}`}
            icon={<Receipt className="w-5 h-5 text-orange-500" />}
          />
          <SummaryCard
            title="Pending"
            value={`$${summary.pending_amount.toLocaleString()}`}
            icon={<Clock className="w-5 h-5 text-yellow-500" />}
            subtitle="Awaiting settlement"
          />
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-4 items-center">
        <select
          value={filter.type || ""}
          onChange={(e) =>
            setFilter((prev) => ({
              ...prev,
              type: (e.target.value as LedgerEntryType) || undefined,
            }))
          }
          className="h-9 px-3 rounded-lg bg-[#111] border border-[#333] text-sm text-white focus:outline-none focus:border-[#22D3EE]"
        >
          <option value="">All Types</option>
          <option value="payout">Payouts</option>
          <option value="advance">Advances</option>
          <option value="fee">Fees</option>
          <option value="deposit">Deposits</option>
        </select>

        <select
          value={filter.status || ""}
          onChange={(e) =>
            setFilter((prev) => ({
              ...prev,
              status: (e.target.value as LedgerEntryStatus) || undefined,
            }))
          }
          className="h-9 px-3 rounded-lg bg-[#111] border border-[#333] text-sm text-white focus:outline-none focus:border-[#22D3EE]"
        >
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="processing">Processing</option>
          <option value="settled">Settled</option>
          <option value="failed">Failed</option>
        </select>
      </div>

      {/* Transactions Table */}
      <div className="bg-[#111] border border-[#333] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 uppercase bg-[#0A0A0A] border-b border-[#333]">
              <tr>
                <th className="px-6 py-3">Type</th>
                <th className="px-6 py-3">Amount</th>
                <th className="px-6 py-3">Fee</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Reference</th>
                <th className="px-6 py-3">Date</th>
                <th className="px-6 py-3">Tx Hash</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#333]">
              {entries.length > 0 ? (
                entries.map((entry) => {
                  const TypeIcon = typeIcons[entry.entry_type] || Receipt;
                  const StatusIcon = statusIcons[entry.status] || Clock;
                  const typeColor =
                    typeColors[entry.entry_type] || "text-gray-500";
                  const statusStyle =
                    statusColors[entry.status] || statusColors.pending;

                  return (
                    <tr
                      key={entry.id}
                      className="hover:bg-[#1A1A1A] transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div
                            className={`p-1.5 rounded-lg bg-[#0A0A0A] border border-[#333] ${typeColor}`}
                          >
                            <TypeIcon className="w-4 h-4" />
                          </div>
                          <span className="font-medium text-white capitalize">
                            {entry.entry_type}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`font-bold ${typeColor}`}>
                          {formatAmount(entry.amount_usd, entry.entry_type)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-400">
                        {entry.fee_usd > 0
                          ? `$${entry.fee_usd.toFixed(2)}`
                          : "-"}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border capitalize ${statusStyle}`}
                        >
                          <StatusIcon className="w-3 h-3" />
                          {entry.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-400">
                        {entry.reference_type && (
                          <span className="text-xs">
                            {entry.reference_type}:{" "}
                            {entry.reference_id?.slice(0, 8)}...
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-gray-400 text-xs">
                        {formatDate(entry.created_at)}
                      </td>
                      <td className="px-6 py-4">
                        {entry.transaction_hash ? (
                          <a
                            href={`https://testnet.snowtrace.io/tx/${entry.transaction_hash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[#22D3EE] hover:underline text-xs"
                          >
                            {entry.transaction_hash.slice(0, 10)}...
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : (
                          <span className="text-gray-500 text-xs">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-[#1A1A1A] flex items-center justify-center">
                        <TrendingUp className="w-6 h-6 text-gray-500" />
                      </div>
                      <p className="text-gray-500">No transactions yet</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({
  title,
  value,
  icon,
  subtitle,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  subtitle?: string;
}) {
  return (
    <div className="bg-[#111] border border-[#333] rounded-xl p-5 hover:border-[#22D3EE]/30 transition-colors">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-400">{title}</h3>
        <div className="p-2 bg-black rounded-lg border border-[#333]">
          {icon}
        </div>
      </div>
      <span className="text-2xl font-bold text-white">{value}</span>
      {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
    </div>
  );
}
