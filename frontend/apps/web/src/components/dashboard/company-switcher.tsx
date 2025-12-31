"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2,
  ChevronDown,
  Check,
  Plus,
  Search,
  AlertCircle,
  Briefcase,
} from "lucide-react";
import { useAuth, type CompanyMembership } from "@/context/auth-context";

export function CompanySwitcher() {
  const { activeCompany, companies, switchCompany, addCompany, isDemo } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isAddingCompany, setIsAddingCompany] = useState(false);
  const [newCompanySlug, setNewCompanySlug] = useState("");
  const [addError, setAddError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setIsAddingCompany(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSwitchCompany = async (companyId: string) => {
    if (companyId === activeCompany?.id) {
      setIsOpen(false);
      return;
    }

    setIsLoading(true);
    await switchCompany(companyId);
    setIsLoading(false);
    setIsOpen(false);
  };

  const handleAddCompany = async () => {
    if (!newCompanySlug.trim()) {
      setAddError("Please enter a company code");
      return;
    }

    setIsLoading(true);
    setAddError(null);

    const success = await addCompany(newCompanySlug.trim());

    if (success) {
      setNewCompanySlug("");
      setIsAddingCompany(false);
    } else {
      setAddError("Company not found or already joined");
    }

    setIsLoading(false);
  };

  const getRoleBadge = (role: string) => {
    const colors = {
      admin: "bg-purple-400/10 text-purple-400",
      manager: "bg-cyan-400/10 text-cyan-400",
      employee: "bg-white/10 text-white/60",
    };
    return colors[role as keyof typeof colors] || colors.employee;
  };

  if (!activeCompany) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/10 hover:border-white/20 transition-all group"
      >
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400/20 to-purple-400/20 flex items-center justify-center">
          <Building2 className="w-4 h-4 text-cyan-400" />
        </div>
        <div className="text-left">
          <p className="text-white text-sm font-medium leading-none">
            {activeCompany.name}
          </p>
          {companies.length > 1 && (
            <p className="text-white/40 text-xs mt-0.5">
              {companies.length} companies
            </p>
          )}
        </div>
        <ChevronDown
          className={`w-4 h-4 text-white/40 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Dropdown menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 mt-2 w-80 rounded-xl bg-[#1a1a2e] border border-white/10 shadow-2xl shadow-black/50 overflow-hidden z-50"
          >
            {/* Header */}
            <div className="px-4 py-3 border-b border-white/10">
              <p className="text-white/40 text-xs font-medium uppercase tracking-wider">
                Switch Company
              </p>
            </div>

            {/* Company list */}
            <div className="max-h-64 overflow-y-auto">
              {companies.map((membership) => (
                <CompanyItem
                  key={membership.company_id}
                  membership={membership}
                  isActive={membership.company_id === activeCompany.id}
                  isLoading={isLoading}
                  onClick={() => handleSwitchCompany(membership.company_id)}
                  getRoleBadge={getRoleBadge}
                />
              ))}
            </div>

            {/* Add company section */}
            <div className="border-t border-white/10">
              {isAddingCompany ? (
                <div className="p-4">
                  <div className="relative">
                    <input
                      type="text"
                      value={newCompanySlug}
                      onChange={(e) => setNewCompanySlug(e.target.value)}
                      placeholder="Enter company code..."
                      className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/30 text-sm focus:outline-none focus:border-cyan-400/50"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleAddCompany();
                        if (e.key === "Escape") setIsAddingCompany(false);
                      }}
                    />
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  </div>
                  {addError && (
                    <div className="flex items-center gap-2 mt-2 text-red-400 text-xs">
                      <AlertCircle className="w-3 h-3" />
                      {addError}
                    </div>
                  )}
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => {
                        setIsAddingCompany(false);
                        setAddError(null);
                        setNewCompanySlug("");
                      }}
                      className="flex-1 px-3 py-2 rounded-lg bg-white/5 text-white/60 text-sm hover:bg-white/10 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleAddCompany}
                      disabled={isLoading || !newCompanySlug.trim()}
                      className="flex-1 px-3 py-2 rounded-lg bg-cyan-400 text-black text-sm font-medium hover:bg-cyan-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoading ? "Joining..." : "Join"}
                    </button>
                  </div>
                  <p className="text-white/30 text-xs mt-3">
                    Ask your company admin for the company code
                  </p>
                </div>
              ) : (
                <button
                  onClick={() => setIsAddingCompany(true)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/5 transition-colors group"
                >
                  <div className="w-8 h-8 rounded-lg bg-white/5 border border-dashed border-white/20 flex items-center justify-center group-hover:border-cyan-400/50 transition-colors">
                    <Plus className="w-4 h-4 text-white/40 group-hover:text-cyan-400 transition-colors" />
                  </div>
                  <div>
                    <p className="text-white/60 text-sm group-hover:text-white transition-colors">
                      Add another company
                    </p>
                    <p className="text-white/30 text-xs">
                      Join with company code
                    </p>
                  </div>
                </button>
              )}
            </div>

            {/* Demo mode indicator */}
            {isDemo && (
              <div className="px-4 py-2 bg-amber-400/10 border-t border-amber-400/20">
                <p className="text-amber-400 text-xs text-center">
                  Demo Mode - Company switching simulated
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function CompanyItem({
  membership,
  isActive,
  isLoading,
  onClick,
  getRoleBadge,
}: {
  membership: CompanyMembership;
  isActive: boolean;
  isLoading: boolean;
  onClick: () => void;
  getRoleBadge: (role: string) => string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={isLoading}
      className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
        isActive
          ? "bg-cyan-400/10"
          : "hover:bg-white/5"
      } ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
    >
      <div
        className={`w-10 h-10 rounded-lg flex items-center justify-center ${
          isActive
            ? "bg-cyan-400/20"
            : "bg-white/5"
        }`}
      >
        {membership.is_primary ? (
          <Building2
            className={`w-5 h-5 ${
              isActive ? "text-cyan-400" : "text-white/40"
            }`}
          />
        ) : (
          <Briefcase
            className={`w-5 h-5 ${
              isActive ? "text-cyan-400" : "text-white/40"
            }`}
          />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p
            className={`text-sm font-medium truncate ${
              isActive ? "text-cyan-400" : "text-white"
            }`}
          >
            {membership.company_name}
          </p>
          {membership.is_primary && (
            <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-purple-400/10 text-purple-400">
              Primary
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span
            className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${getRoleBadge(
              membership.role
            )}`}
          >
            {membership.role}
          </span>
          {membership.department && (
            <span className="text-white/30 text-xs truncate">
              {membership.department}
            </span>
          )}
        </div>
      </div>
      {isActive && (
        <Check className="w-5 h-5 text-cyan-400 flex-shrink-0" />
      )}
    </button>
  );
}
