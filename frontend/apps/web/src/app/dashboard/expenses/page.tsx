"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Filter,
  Receipt,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  Download,
  ChevronDown,
  X,
  Calendar,
  Tag,
  FileText,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";

// Demo data
const demoExpenses = [
  {
    id: "EXP-001",
    vendor: "United Airlines",
    amount: 450.00,
    category: "Travel",
    status: "approved",
    date: "2024-01-15",
    submittedAt: "2024-01-15T10:30:00Z",
    approvedAt: "2024-01-15T10:30:05Z",
    paidOut: true,
    receiptUrl: "#",
  },
  {
    id: "EXP-002",
    vendor: "Hilton Hotels",
    amount: 320.00,
    category: "Accommodation",
    status: "approved",
    date: "2024-01-14",
    submittedAt: "2024-01-14T16:45:00Z",
    approvedAt: "2024-01-14T16:45:04Z",
    paidOut: true,
    receiptUrl: "#",
  },
  {
    id: "EXP-003",
    vendor: "Uber",
    amount: 45.50,
    category: "Transportation",
    status: "pending",
    date: "2024-01-14",
    submittedAt: "2024-01-14T09:15:00Z",
    approvedAt: null,
    paidOut: false,
    receiptUrl: "#",
  },
  {
    id: "EXP-004",
    vendor: "Starbucks",
    amount: 28.00,
    category: "Meals",
    status: "approved",
    date: "2024-01-13",
    submittedAt: "2024-01-13T08:00:00Z",
    approvedAt: "2024-01-13T08:00:03Z",
    paidOut: true,
    receiptUrl: "#",
  },
  {
    id: "EXP-005",
    vendor: "Amazon Web Services",
    amount: 199.99,
    category: "Software",
    status: "rejected",
    date: "2024-01-12",
    submittedAt: "2024-01-12T14:20:00Z",
    approvedAt: null,
    paidOut: false,
    receiptUrl: "#",
    rejectionReason: "Software subscriptions require pre-approval",
  },
  {
    id: "EXP-006",
    vendor: "Office Depot",
    amount: 156.78,
    category: "Office Supplies",
    status: "approved",
    date: "2024-01-11",
    submittedAt: "2024-01-11T11:30:00Z",
    approvedAt: "2024-01-11T11:30:04Z",
    paidOut: true,
    receiptUrl: "#",
  },
  {
    id: "EXP-007",
    vendor: "Delta Airlines",
    amount: 385.00,
    category: "Travel",
    status: "approved",
    date: "2024-01-10",
    submittedAt: "2024-01-10T09:00:00Z",
    approvedAt: "2024-01-10T09:00:05Z",
    paidOut: true,
    receiptUrl: "#",
  },
];

type FilterStatus = "all" | "approved" | "pending" | "rejected";

export default function ExpensesPage() {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<(typeof demoExpenses)[0] | null>(null);

  const filteredExpenses = demoExpenses.filter((expense) => {
    const matchesSearch =
      expense.vendor.toLowerCase().includes(search.toLowerCase()) ||
      expense.id.toLowerCase().includes(search.toLowerCase()) ||
      expense.category.toLowerCase().includes(search.toLowerCase());
    const matchesStatus =
      filterStatus === "all" || expense.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const statusCounts = {
    all: demoExpenses.length,
    approved: demoExpenses.filter((e) => e.status === "approved").length,
    pending: demoExpenses.filter((e) => e.status === "pending").length,
    rejected: demoExpenses.filter((e) => e.status === "rejected").length,
  };

  return (
    <div className="space-y-6">
      {/* Expense Detail Modal */}
      <AnimatePresence>
        {selectedExpense && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setSelectedExpense(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg bg-navy-800 rounded-2xl border border-white/10 shadow-2xl overflow-hidden"
            >
              {/* Modal header */}
              <div className="flex items-center justify-between p-6 border-b border-white/10">
                <h3 className="text-lg font-semibold text-white">Expense Details</h3>
                <button
                  onClick={() => setSelectedExpense(null)}
                  className="p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal content */}
              <div className="p-6 space-y-6">
                {/* Vendor and amount */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center">
                      <Receipt className="w-6 h-6 text-white/30" />
                    </div>
                    <div>
                      <p className="text-white font-semibold text-lg">{selectedExpense.vendor}</p>
                      <p className="text-white/40 text-sm">{selectedExpense.id}</p>
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-white">
                    {formatCurrency(selectedExpense.amount)}
                  </p>
                </div>

                {/* Status badge */}
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${
                      selectedExpense.status === "approved"
                        ? "text-emerald-400 bg-emerald-400/10"
                        : selectedExpense.status === "pending"
                        ? "text-amber-400 bg-amber-400/10"
                        : "text-red-400 bg-red-400/10"
                    }`}
                  >
                    {selectedExpense.status === "approved" && <CheckCircle className="w-4 h-4" />}
                    {selectedExpense.status === "pending" && <Clock className="w-4 h-4" />}
                    {selectedExpense.status === "rejected" && <XCircle className="w-4 h-4" />}
                    {selectedExpense.status.charAt(0).toUpperCase() + selectedExpense.status.slice(1)}
                  </span>
                  {selectedExpense.paidOut && (
                    <span className="px-3 py-1.5 rounded-full text-sm font-medium text-cyan-400 bg-cyan-400/10">
                      Paid Out
                    </span>
                  )}
                </div>

                {/* Details grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                    <div className="flex items-center gap-2 text-white/40 text-sm mb-1">
                      <Tag className="w-4 h-4" />
                      Category
                    </div>
                    <p className="text-white font-medium">{selectedExpense.category}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                    <div className="flex items-center gap-2 text-white/40 text-sm mb-1">
                      <Calendar className="w-4 h-4" />
                      Date
                    </div>
                    <p className="text-white font-medium">{selectedExpense.date}</p>
                  </div>
                </div>

                {/* Rejection reason */}
                {selectedExpense.rejectionReason && (
                  <div className="p-4 rounded-xl bg-red-400/5 border border-red-400/20">
                    <p className="text-red-400 text-sm font-medium mb-1">Rejection Reason</p>
                    <p className="text-red-400/70 text-sm">{selectedExpense.rejectionReason}</p>
                  </div>
                )}

                {/* Timestamps */}
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between text-white/40">
                    <span>Submitted</span>
                    <span>{new Date(selectedExpense.submittedAt).toLocaleString()}</span>
                  </div>
                  {selectedExpense.approvedAt && (
                    <div className="flex items-center justify-between text-white/40">
                      <span>Approved</span>
                      <span>{new Date(selectedExpense.approvedAt).toLocaleString()}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Modal footer */}
              <div className="flex items-center gap-3 p-6 border-t border-white/10 bg-white/[0.02]">
                <button
                  onClick={() => setSelectedExpense(null)}
                  className="flex-1 btn-secondary"
                >
                  Close
                </button>
                <button className="flex-1 btn-primary">
                  <FileText className="w-4 h-4" />
                  View Receipt
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white">
            My Expenses
          </h1>
          <p className="text-white/50 mt-1">
            View and manage all your submitted expenses.
          </p>
        </div>
        <a href="/dashboard/submit" className="btn-primary">
          <Receipt className="w-4 h-4" />
          New Expense
        </a>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatBadge
          label="All"
          count={statusCounts.all}
          active={filterStatus === "all"}
          onClick={() => setFilterStatus("all")}
        />
        <StatBadge
          label="Approved"
          count={statusCounts.approved}
          color="emerald"
          active={filterStatus === "approved"}
          onClick={() => setFilterStatus("approved")}
        />
        <StatBadge
          label="Pending"
          count={statusCounts.pending}
          color="amber"
          active={filterStatus === "pending"}
          onClick={() => setFilterStatus("pending")}
        />
        <StatBadge
          label="Rejected"
          count={statusCounts.rejected}
          color="red"
          active={filterStatus === "rejected"}
          onClick={() => setFilterStatus("rejected")}
        />
      </div>

      {/* Search and filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by vendor, ID, or category..."
            className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-cyan-400/50"
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="btn-secondary"
        >
          <Filter className="w-4 h-4" />
          Filters
          <ChevronDown
            className={`w-4 h-4 transition-transform ${
              showFilters ? "rotate-180" : ""
            }`}
          />
        </button>
      </div>

      {/* Expense list */}
      <div className="card overflow-hidden">
        {/* Table header */}
        <div className="hidden lg:grid grid-cols-12 gap-4 p-4 border-b border-white/10 text-white/40 text-sm font-medium">
          <div className="col-span-4">Expense</div>
          <div className="col-span-2">Amount</div>
          <div className="col-span-2">Date</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-2 text-right">Actions</div>
        </div>

        {/* Table rows */}
        <div className="divide-y divide-white/5">
          {filteredExpenses.length === 0 ? (
            <div className="p-12 text-center">
              <Receipt className="w-12 h-12 text-white/20 mx-auto mb-4" />
              <p className="text-white/50">No expenses found</p>
              <p className="text-white/30 text-sm">
                Try adjusting your search or filters
              </p>
            </div>
          ) : (
            filteredExpenses.map((expense) => (
              <ExpenseRow 
                key={expense.id} 
                expense={expense} 
                onView={() => setSelectedExpense(expense)}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function StatBadge({
  label,
  count,
  color = "white",
  active,
  onClick,
}: {
  label: string;
  count: number;
  color?: "white" | "emerald" | "amber" | "red";
  active: boolean;
  onClick: () => void;
}) {
  const colorClasses = {
    white: active
      ? "border-cyan-400 bg-cyan-400/10 text-cyan-400"
      : "border-white/10 text-white/50 hover:border-white/20",
    emerald: active
      ? "border-emerald-400 bg-emerald-400/10 text-emerald-400"
      : "border-white/10 text-white/50 hover:border-emerald-400/30",
    amber: active
      ? "border-amber-400 bg-amber-400/10 text-amber-400"
      : "border-white/10 text-white/50 hover:border-amber-400/30",
    red: active
      ? "border-red-400 bg-red-400/10 text-red-400"
      : "border-white/10 text-white/50 hover:border-red-400/30",
  };

  return (
    <button
      onClick={onClick}
      className={`p-4 rounded-xl border transition-all ${colorClasses[color]}`}
    >
      <p className="text-2xl font-bold">{count}</p>
      <p className="text-sm opacity-70">{label}</p>
    </button>
  );
}

function ExpenseRow({ expense, onView }: { expense: (typeof demoExpenses)[0]; onView: () => void }) {
  const statusConfig = {
    approved: {
      icon: CheckCircle,
      color: "text-emerald-400 bg-emerald-400/10",
      label: "Approved",
    },
    pending: {
      icon: Clock,
      color: "text-amber-400 bg-amber-400/10",
      label: "Pending",
    },
    rejected: {
      icon: XCircle,
      color: "text-red-400 bg-red-400/10",
      label: "Rejected",
    },
  };

  const status = statusConfig[expense.status as keyof typeof statusConfig];
  const StatusIcon = status.icon;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 p-4 hover:bg-white/[0.02] transition-colors">
      {/* Expense info */}
      <div className="lg:col-span-4 flex items-center gap-4">
        <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center">
          <Receipt className="w-5 h-5 text-white/30" />
        </div>
        <div>
          <p className="text-white font-medium">{expense.vendor}</p>
          <p className="text-white/40 text-sm">
            {expense.id} • {expense.category}
          </p>
        </div>
      </div>

      {/* Amount */}
      <div className="lg:col-span-2 flex items-center">
        <div className="lg:hidden text-white/40 text-sm w-24">Amount</div>
        <p className="text-white font-medium">
          {formatCurrency(expense.amount)}
        </p>
      </div>

      {/* Date */}
      <div className="lg:col-span-2 flex items-center">
        <div className="lg:hidden text-white/40 text-sm w-24">Date</div>
        <p className="text-white/70">{expense.date}</p>
      </div>

      {/* Status */}
      <div className="lg:col-span-2 flex items-center">
        <div className="lg:hidden text-white/40 text-sm w-24">Status</div>
        <span
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${status.color}`}
        >
          <StatusIcon className="w-3.5 h-3.5" />
          {status.label}
        </span>
      </div>

      {/* Actions */}
      <div className="lg:col-span-2 flex items-center justify-end gap-2">
        <button 
          onClick={onView}
          className="p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition-colors"
          title="View details"
        >
          <Eye className="w-4 h-4" />
        </button>
        <button 
          className="p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition-colors"
          title="Download receipt"
        >
          <Download className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
