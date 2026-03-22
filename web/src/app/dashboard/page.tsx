"use client";

import { useEffect, useState } from "react";
import {
  ArrowUpRight,
  Wallet,
  DollarSign,
  FileText,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { useAuth, useProfile } from "@/hooks";
import Link from "next/link";
import { employeeApi } from "@/lib/api";
import { toast } from "sonner";

export default function DashboardPage() {
  const { loading: authLoading } = useAuth();
  const {
    employee,
    company,
    isCompany,
    isEmployee,
    refreshProfile,
    loading: profileLoading,
  } = useProfile();
  const [isLoading, setIsLoading] = useState(true);
  const [acceptingInvite, setAcceptingInvite] = useState(false);
  const isCompanyAccount = isCompany;

  type RecentReceipt = {
    id: string;
    employee_id: string;
    merchant?: string | null;
    created_at: string;
    amount?: number | null;
    status: string;
  };

  useEffect(() => {
    if (!authLoading && !profileLoading) setIsLoading(false);
  }, [authLoading, profileLoading]);

  if (authLoading || profileLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-2 border-[#22D3EE] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (isEmployee && employee && !employee.company_id) {
    const invitedBy = employee.invitedby?.trim?.() ? employee.invitedby : "";
    const acceptInvite = async () => {
      setAcceptingInvite(true);
      const response = await employeeApi.acceptInvite();
      if (!response.success) {
        toast.error(response.error?.message || "Failed to accept invitation");
        setAcceptingInvite(false);
        return;
      }
      await refreshProfile();
      toast.success(response.data?.message || "Invitation accepted");
      setAcceptingInvite(false);
    };

    const refresh = async () => {
      setAcceptingInvite(true);
      await refreshProfile();
      setAcceptingInvite(false);
    };

    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Dashboard
          </h1>
          <p className="text-gray-400">
            Welcome back, {employee?.name || "User"}
          </p>
        </div>

        <div className="bg-[#111] border border-[#333] rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-white font-semibold">Company invitation</p>
              <p className="text-white/50 text-sm">
                {invitedBy
                  ? `Invited by ${invitedBy}. Accept to unlock your dashboard.`
                  : "No invitation found yet. Ask your company admin to invite you."}
              </p>
            </div>
            <button
              onClick={refresh}
              disabled={acceptingInvite}
              className="btn-secondary disabled:opacity-50"
            >
              {acceptingInvite ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Loading...
                </>
              ) : (
                "Refresh"
              )}
            </button>
          </div>

          {invitedBy ? (
            <button
              onClick={acceptInvite}
              disabled={acceptingInvite}
              className="btn-primary w-full disabled:opacity-50"
            >
              {acceptingInvite ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Accepting...
                </>
              ) : (
                "Accept invitation"
              )}
            </button>
          ) : null}
        </div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <p className="text-gray-400">No company found for this account.</p>
      </div>
    );
  }

  const recentReceipts: RecentReceipt[] = [];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Dashboard
          </h1>
          <p className="text-gray-400">
            Welcome back,{" "}
            {isCompanyAccount
              ? company.name || "Company"
              : employee?.name || "User"}
          </p>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard
          title="Treasury Balance"
          value="—"
          subtext="USDC in vault"
          icon={<Wallet className="w-5 h-5 text-[#22D3EE]" />}
        />
        <MetricCard
          title="Monthly Spend"
          value="—"
          icon={<DollarSign className="w-5 h-5 text-[#22D3EE]" />}
        />
        <MetricCard
          title="Pending Approvals"
          value="—"
          subtext="Requires attention"
          icon={<FileText className="w-5 h-5 text-orange-400" />}
        />
        <MetricCard
          title="Total Employees"
          value="—"
          subtext="—"
          icon={<AlertCircle className="w-5 h-5 text-green-500" />}
        />
      </div>

      {/* Chart Section */}
      <div className="bg-[#111] border border-[#333] rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-6">
          Spending Trends
        </h3>
        <div className="h-64 flex items-end justify-between gap-2 px-4">
          {[35, 45, 30, 60, 75, 50, 65, 80, 70, 90, 85, 95].map((height, i) => (
            <div
              key={i}
              className="flex-1 flex flex-col items-center gap-2 group"
            >
              <div
                className="w-full bg-[#22D3EE]/20 rounded-t-sm hover:bg-[#22D3EE] transition-all duration-300 relative"
                style={{ height: `${height}%` }}
              >
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black border border-[#333] px-2 py-1 rounded text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                  ${height * 1000}
                </div>
              </div>
              <span className="text-xs text-gray-500">
                {
                  [
                    "Jan",
                    "Feb",
                    "Mar",
                    "Apr",
                    "May",
                    "Jun",
                    "Jul",
                    "Aug",
                    "Sep",
                    "Oct",
                    "Nov",
                    "Dec",
                  ][i]
                }
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Submissions Table */}
      <div className="bg-[#111] border border-[#333] rounded-xl overflow-hidden">
        <div className="p-6 border-b border-[#333] flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">
            Recent Submissions
          </h3>
          <Link
            href="/dashboard/expenses"
            className="text-sm text-[#22D3EE] hover:underline"
          >
            View All
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 uppercase bg-[#0A0A0A] border-b border-[#333]">
              <tr>
                <th className="px-6 py-3">Employee</th>
                <th className="px-6 py-3">Merchant</th>
                <th className="px-6 py-3">Date</th>
                <th className="px-6 py-3">Amount</th>
                <th className="px-6 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#333]">
              {recentReceipts.length > 0 ? (
                recentReceipts.map((receipt) => (
                  <tr
                    key={receipt.id}
                    className="hover:bg-[#1A1A1A] transition-colors"
                  >
                    <td className="px-6 py-4 font-medium text-white">
                      {receipt.employee_id.slice(0, 8)}...
                    </td>
                    <td className="px-6 py-4 text-gray-300">
                      {receipt.merchant || "Processing..."}
                    </td>
                    <td className="px-6 py-4 text-gray-400">
                      {new Date(receipt.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-white font-medium">
                      ${receipt.amount?.toFixed(2) || "0.00"}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={receipt.status} />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-8 text-center text-gray-500"
                  >
                    No receipts yet.{" "}
                    { isEmployee && employee?.company_id ? (
                    <Link
                      href="/dashboard/submit"
                      className="text-[#22D3EE] hover:underline"
                    >
                      Upload your first receipt
                    </Link>
                    ) : null}
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

function MetricCard({
  title,
  value,
  change,
  subtext,
  icon,
}: {
  title: string;
  value: string;
  change?: string;
  subtext?: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="bg-[#111] border border-[#333] rounded-xl p-6 hover:border-[#22D3EE]/30 transition-colors">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-400">{title}</h3>
        <div className="p-2 bg-black rounded-lg border border-[#333]">
          {icon}
        </div>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-bold text-white">{value}</span>
        {change && (
          <span className="text-xs font-medium text-green-400 flex items-center">
            <ArrowUpRight className="w-3 h-3 mr-0.5" />
            {change}
          </span>
        )}
      </div>
      {subtext && <p className="text-xs text-gray-500 mt-1">{subtext}</p>}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    approved: "bg-green-500/10 text-green-500 border-green-500/20",
    processing: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    flagged: "bg-red-500/10 text-red-500 border-red-500/20",
    rejected: "bg-gray-500/10 text-gray-500 border-gray-500/20",
    uploaded: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
    paid: "bg-[#22D3EE]/10 text-[#22D3EE] border-[#22D3EE]/20",
  };

  return (
    <span
      className={`px-2.5 py-0.5 rounded-full text-xs font-medium border capitalize ${styles[status] || styles.rejected}`}
    >
      {status}
    </span>
  );
}
