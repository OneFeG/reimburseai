"use client";

import { useCallback, useEffect, useState } from "react";
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
import { toast } from "sonner";
import { useProfile } from "@/hooks";
import { receiptApi, type Audit } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";

type FilterStatus = "all" | "approved" | "pending" | "rejected";

export default function ExpensesPage() {
  const { employee, company } = useProfile();
  const isEmployee = Boolean(employee?.id);

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [showFilters, setShowFilters] = useState(false);
  const [audits, setAudits] = useState<Audit[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAudit, setSelectedAudit] = useState<Audit | null>(null);

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

      setAudits(response.data);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to load audits",
      );
      setAudits([]);
    } finally {
      setLoading(false);
    }
  }, [isEmployee]);

  useEffect(() => {
    if (isEmployee && !employee?.id) return;
    if (!isEmployee && !company?.id) return;
    loadAudits();
  }, [company?.id, employee?.id, isEmployee, loadAudits]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-2 border-[#22D3EE] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const filteredAudits = audits.filter((audit) => {
    const merchant = (audit.merchant || "Unknown").toLowerCase();
    const category = (
      audit.category ||
      audit.merchant_category ||
      "Uncategorized"
    ).toLowerCase();
    const status =
      audit.status === "approved" ||
      audit.status === "rejected" ||
      audit.status === "processing"
        ? audit.status
        : "pending";

    const matchesSearch =
      merchant.includes(search.toLowerCase()) ||
      audit.id.toLowerCase().includes(search.toLowerCase()) ||
      category.includes(search.toLowerCase());

    const matchesStatus = (() => {
      if (filterStatus === "all") return true;
      if (filterStatus === "pending")
        return status === "pending" || status === "processing";
      return status === filterStatus;
    })();

    return matchesSearch && matchesStatus;
  });

  const statusCounts = {
    all: audits.length,
    approved: audits.filter((a) => a.status === "approved").length,
    pending: audits.filter(
      (a) => a.status !== "approved" && a.status !== "rejected",
    ).length,
    rejected: audits.filter((a) => a.status === "rejected").length,
  };

  return (
    <div className="space-y-6">
      {/* Expense Detail Modal */}
      <AnimatePresence>
        {selectedAudit && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setSelectedAudit(null)}
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
                <h3 className="text-lg font-semibold text-white">
                  Expense Details
                </h3>
                <button
                  onClick={() => setSelectedAudit(null)}
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
                      <p className="text-white font-semibold text-lg">
                        {selectedAudit.merchant || "Unknown"}
                      </p>
                      <p className="text-white/40 text-sm">
                        {selectedAudit.id}
                      </p>
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-white">
                    {formatCurrency(Number(selectedAudit.amount || 0))}
                  </p>
                </div>

                {/* Status badge */}
                <div className="flex items-center gap-2">
                  {(() => {
                    const status =
                      selectedAudit.status === "approved" ||
                      selectedAudit.status === "rejected" ||
                      selectedAudit.status === "processing"
                        ? selectedAudit.status
                        : "pending";

                    const statusClass =
                      status === "approved"
                        ? "text-emerald-400 bg-emerald-400/10"
                        : status === "processing"
                          ? "text-blue-400 bg-blue-400/10"
                          : status === "pending"
                            ? "text-amber-400 bg-amber-400/10"
                            : "text-red-400 bg-red-400/10";

                    return (
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${statusClass}`}
                      >
                        {status === "approved" && (
                          <CheckCircle className="w-4 h-4" />
                        )}
                        {(status === "processing" || status === "pending") && (
                          <Clock className="w-4 h-4" />
                        )}
                        {status === "rejected" && (
                          <XCircle className="w-4 h-4" />
                        )}
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </span>
                    );
                  })()}
                  {Boolean(selectedAudit.payout_tx_hash) && (
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
                    <p className="text-white font-medium">
                      {selectedAudit.category ||
                        selectedAudit.merchant_category ||
                        "Uncategorized"}
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                    <div className="flex items-center gap-2 text-white/40 text-sm mb-1">
                      <Calendar className="w-4 h-4" />
                      Date
                    </div>
                    <p className="text-white font-medium">
                      {formatDate(
                        selectedAudit.receipt_date || selectedAudit.created_at,
                      )}
                    </p>
                  </div>
                </div>

                {/* Rejection reason */}
                {selectedAudit.status === "rejected" &&
                  selectedAudit.ai_decision_reason && (
                    <div className="p-4 rounded-xl bg-red-400/5 border border-red-400/20">
                      <p className="text-red-400 text-sm font-medium mb-1">
                        Rejection Reason
                      </p>
                      <p className="text-red-400/70 text-sm">
                        {selectedAudit.ai_decision_reason}
                      </p>
                    </div>
                  )}

                {/* Timestamps */}
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between text-white/40">
                    <span>Submitted</span>
                    <span>
                      {new Date(selectedAudit.created_at).toLocaleString()}
                    </span>
                  </div>
                  {selectedAudit.status &&
                    selectedAudit.status !== "pending" && (
                      <div className="flex items-center justify-between text-white/40">
                        <span>Updated</span>
                        <span>
                          {new Date(selectedAudit.updated_at).toLocaleString()}
                        </span>
                      </div>
                    )}
                </div>
              </div>

              {/* Modal footer */}
              <div className="flex items-center gap-3 p-6 border-t border-white/10 bg-white/[0.02]">
                <button
                  onClick={() => setSelectedAudit(null)}
                  className="flex-1 btn-secondary"
                >
                  Close
                </button>
                <button
                  className="flex-1 btn-primary"
                  onClick={() => {
                    if (selectedAudit.file_path) {
                      window.open(selectedAudit.file_path, "_blank");
                      return;
                    }
                    toast.error("Receipt file is not available yet");
                  }}
                >
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
          {filteredAudits.length === 0 ? (
            <div className="p-12 text-center">
              <Receipt className="w-12 h-12 text-white/20 mx-auto mb-4" />
              <p className="text-white/50">No expenses found</p>
              <p className="text-white/30 text-sm">
                Try adjusting your search or filters
              </p>
            </div>
          ) : (
            filteredAudits.map((audit) => (
              <ExpenseRow
                key={audit.id}
                audit={audit}
                onView={() => setSelectedAudit(audit)}
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

function ExpenseRow({ audit, onView }: { audit: Audit; onView: () => void }) {
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
    processing: {
      icon: Clock,
      color: "text-blue-400 bg-blue-400/10",
      label: "Processing",
    },
    rejected: {
      icon: XCircle,
      color: "text-red-400 bg-red-400/10",
      label: "Rejected",
    },
  };

  const statusKey =
    audit.status === "approved" ||
    audit.status === "rejected" ||
    audit.status === "processing"
      ? audit.status
      : "pending";
  const status = statusConfig[statusKey as keyof typeof statusConfig];
  const StatusIcon = status.icon;

  const merchant = audit.merchant || "Unknown";
  const category = audit.category || audit.merchant_category || "Uncategorized";
  const date = audit.receipt_date || audit.created_at;
  const amount = Number(audit.amount || 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 p-4 hover:bg-white/[0.02] transition-colors">
      {/* Expense info */}
      <div className="lg:col-span-4 flex items-center gap-4">
        <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center">
          <Receipt className="w-5 h-5 text-white/30" />
        </div>
        <div>
          <p className="text-white font-medium">{merchant}</p>
          <p className="text-white/40 text-sm">
            {audit.id} • {category}
          </p>
        </div>
      </div>

      {/* Amount */}
      <div className="lg:col-span-2 flex items-center">
        <div className="lg:hidden text-white/40 text-sm w-24">Amount</div>
        <p className="text-white font-medium">{formatCurrency(amount)}</p>
      </div>

      {/* Date */}
      <div className="lg:col-span-2 flex items-center">
        <div className="lg:hidden text-white/40 text-sm w-24">Date</div>
        <p className="text-white/70">{formatDate(date)}</p>
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
