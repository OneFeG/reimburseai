"use client";

import { motion } from "framer-motion";
import {
  ArrowUpRight,
  ArrowDownRight,
  Receipt,
  Clock,
  CheckCircle,
  XCircle,
  TrendingUp,
  DollarSign,
  Wallet,
  Activity,
} from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { formatCurrency } from "@/lib/utils";

// Demo data
const demoStats = {
  totalExpenses: 12450.00,
  pendingAmount: 1250.00,
  approvedThisMonth: 8750.00,
  recentPayouts: 3200.00,
};

const demoRecentExpenses = [
  {
    id: "1",
    vendor: "United Airlines",
    amount: 450.00,
    category: "Travel",
    status: "approved",
    date: "2024-01-15",
  },
  {
    id: "2",
    vendor: "Hilton Hotels",
    amount: 320.00,
    category: "Accommodation",
    status: "approved",
    date: "2024-01-14",
  },
  {
    id: "3",
    vendor: "Uber",
    amount: 45.50,
    category: "Transportation",
    status: "pending",
    date: "2024-01-14",
  },
  {
    id: "4",
    vendor: "Starbucks",
    amount: 28.00,
    category: "Meals",
    status: "approved",
    date: "2024-01-13",
  },
  {
    id: "5",
    vendor: "Amazon Web Services",
    amount: 199.99,
    category: "Software",
    status: "rejected",
    date: "2024-01-12",
  },
];

const demoActivity = [
  {
    id: "1",
    type: "payout",
    message: "Received $770.00 USDC payout",
    time: "2 hours ago",
  },
  {
    id: "2",
    type: "approved",
    message: "Expense #1234 approved by AI",
    time: "4 hours ago",
  },
  {
    id: "3",
    type: "submitted",
    message: "Submitted expense for Uber ride",
    time: "5 hours ago",
  },
  {
    id: "4",
    type: "rejected",
    message: "Expense #1230 rejected - exceeds limit",
    time: "1 day ago",
  },
];

export default function DashboardPage() {
  const router = useRouter();
  const { isDemo, isConnected } = useAuth();

  useEffect(() => {
    // Redirect anonymous users to sign-in
    if (!isDemo && !isConnected) {
      router.push("/sign-in");
    }
  }, [isDemo, isConnected, router]);

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-white">Dashboard</h1>
        <p className="text-white/50 mt-1">
          Welcome back! Here's an overview of your expenses.
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <StatCard
          title="Total Expenses"
          value={formatCurrency(demoStats.totalExpenses)}
          change="+12.5%"
          changeType="positive"
          icon={Receipt}
        />
        <StatCard
          title="Pending Review"
          value={formatCurrency(demoStats.pendingAmount)}
          change="3 items"
          changeType="neutral"
          icon={Clock}
        />
        <StatCard
          title="Approved This Month"
          value={formatCurrency(demoStats.approvedThisMonth)}
          change="+8.2%"
          changeType="positive"
          icon={CheckCircle}
        />
        <StatCard
          title="Recent Payouts"
          value={formatCurrency(demoStats.recentPayouts)}
          change="In USDC"
          changeType="neutral"
          icon={Wallet}
        />
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent expenses */}
        <div className="lg:col-span-2">
          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-white">Recent Expenses</h2>
              <a
                href="/dashboard/expenses"
                className="text-cyan-400 text-sm hover:text-cyan-300 transition-colors"
              >
                View all →
              </a>
            </div>
            <div className="space-y-4">
              {demoRecentExpenses.map((expense) => (
                <ExpenseRow key={expense.id} expense={expense} />
              ))}
            </div>
          </div>
        </div>

        {/* Activity feed */}
        <div>
          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-white">Activity</h2>
              <Activity className="w-5 h-5 text-white/30" />
            </div>
            <div className="space-y-4">
              {demoActivity.map((activity) => (
                <ActivityItem key={activity.id} activity={activity} />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <QuickActionCard
          title="Submit Expense"
          description="Upload a receipt for reimbursement"
          href="/dashboard/submit"
          icon={Receipt}
        />
        <QuickActionCard
          title="View History"
          description="See all past transactions"
          href="/dashboard/history"
          icon={Clock}
        />
        <QuickActionCard
          title="Check Balance"
          description="View your USDC wallet balance"
          href="/dashboard/treasury"
          icon={Wallet}
        />
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  change,
  changeType,
  icon: Icon,
}: {
  title: string;
  value: string;
  change: string;
  changeType: "positive" | "negative" | "neutral";
  icon: any;
}) {
  const changeColors = {
    positive: "text-emerald-400",
    negative: "text-red-400",
    neutral: "text-white/40",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="w-10 h-10 rounded-lg bg-cyan-400/10 flex items-center justify-center">
          <Icon className="w-5 h-5 text-cyan-400" />
        </div>
        <span className={`text-sm ${changeColors[changeType]}`}>{change}</span>
      </div>
      <p className="text-white/50 text-sm mb-1">{title}</p>
      <p className="text-2xl font-bold text-white">{value}</p>
    </motion.div>
  );
}

function ExpenseRow({ expense }: { expense: (typeof demoRecentExpenses)[0] }) {
  const statusColors = {
    approved: "bg-emerald-400/10 text-emerald-400",
    pending: "bg-amber-400/10 text-amber-400",
    rejected: "bg-red-400/10 text-red-400",
  };

  const statusIcons = {
    approved: CheckCircle,
    pending: Clock,
    rejected: XCircle,
  };

  const StatusIcon = statusIcons[expense.status as keyof typeof statusIcons];

  return (
    <div className="flex items-center justify-between p-4 rounded-lg bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center">
          <Receipt className="w-5 h-5 text-white/30" />
        </div>
        <div>
          <p className="text-white font-medium">{expense.vendor}</p>
          <p className="text-white/40 text-sm">{expense.category} • {expense.date}</p>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-white font-medium">
          {formatCurrency(expense.amount)}
        </span>
        <span
          className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
            statusColors[expense.status as keyof typeof statusColors]
          }`}
        >
          <StatusIcon className="w-3 h-3" />
          {expense.status}
        </span>
      </div>
    </div>
  );
}

function ActivityItem({ activity }: { activity: (typeof demoActivity)[0] }) {
  const typeIcons = {
    payout: Wallet,
    approved: CheckCircle,
    submitted: Receipt,
    rejected: XCircle,
  };

  const typeColors = {
    payout: "text-emerald-400 bg-emerald-400/10",
    approved: "text-cyan-400 bg-cyan-400/10",
    submitted: "text-purple-400 bg-purple-400/10",
    rejected: "text-red-400 bg-red-400/10",
  };

  const Icon = typeIcons[activity.type as keyof typeof typeIcons];

  return (
    <div className="flex items-start gap-3">
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center ${
          typeColors[activity.type as keyof typeof typeColors]
        }`}
      >
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1">
        <p className="text-white text-sm">{activity.message}</p>
        <p className="text-white/30 text-xs">{activity.time}</p>
      </div>
    </div>
  );
}

function QuickActionCard({
  title,
  description,
  href,
  icon: Icon,
}: {
  title: string;
  description: string;
  href: string;
  icon: any;
}) {
  return (
    <a
      href={href}
      className="card group hover:border-cyan-400/30 transition-all"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-cyan-400/10 flex items-center justify-center group-hover:bg-cyan-400/20 transition-colors">
            <Icon className="w-6 h-6 text-cyan-400" />
          </div>
          <div>
            <p className="text-white font-medium">{title}</p>
            <p className="text-white/40 text-sm">{description}</p>
          </div>
        </div>
        <ArrowUpRight className="w-5 h-5 text-white/30 group-hover:text-cyan-400 transition-colors" />
      </div>
    </a>
  );
}
