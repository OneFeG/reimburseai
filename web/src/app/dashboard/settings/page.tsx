"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import {
  User,
  Building2,
  Bell,
  Shield,
  Wallet,
  Save,
  Loader2,
  Mail,
  Phone,
  MapPin,
  Globe,
  CreditCard,
  Key,
  Smartphone,
  Monitor,
  CheckCircle,
  AlertTriangle,
  Copy,
  Check,
  ExternalLink,
  LogOut,
  Trash2,
  Edit3,
  Camera,
  Zap,
} from "lucide-react";
import { useAuth, useProfile } from "@/hooks";
import { policyApi, type Policy, type PolicyRequest } from "@/lib/api";
import { truncateAddress } from "@/lib/utils";
import { useSearchParams } from "next/navigation";

export default function SettingsPage() {
  const { employee, company, isCompany, policy } = useProfile();
  const searchParams = useSearchParams();
  const user = {
    employee: employee
      ? ({ ...employee, role: employee.employee_role } as any)
      : null,
    company,
  };
  const activeCompany = company;
  const walletAddress = employee?.smart_wallet_address || "";

  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");
  const [savedMessage, setSavedMessage] = useState(false);

  const canManagePolicies =
    isCompany ||
    employee?.employee_role === "admin" ||
    employee?.employee_role === "manager";

  const onboardingPolicies = useMemo(() => {
    const value = searchParams.get("onboarding");
    return value === "1" || value === "true";
  }, [searchParams]);

  const defaultTab = useMemo(() => {
    if (isCompany) return activeCompany ? "company" : "wallet";
    return "profile";
  }, [activeCompany, isCompany]);

  const handleSave = async () => {
    setSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setSaving(false);
    setSavedMessage(true);
    setTimeout(() => setSavedMessage(false), 3000);
  };

  const tabs = useMemo(() => {
    const baseTabs = [
      ...(!isCompany ? [{ id: "profile", label: "Profile", icon: User }] : []),
      ...(activeCompany
        ? [{ id: "company", label: "Company", icon: Building2 }]
        : []),
      ...(activeCompany && canManagePolicies
        ? [{ id: "policies", label: "Policies", icon: Zap }]
        : []),
      { id: "wallet", label: "Wallet", icon: Wallet },
      { id: "notifications", label: "Notifications", icon: Bell },
      { id: "security", label: "Security", icon: Shield },
    ];
    return baseTabs;
  }, [activeCompany, canManagePolicies, isCompany]);

  useEffect(() => {
    if (isCompany && activeTab === "profile") setActiveTab(defaultTab);
    if (!activeCompany && activeTab === "company") setActiveTab(defaultTab);
    if ((!activeCompany || !canManagePolicies) && activeTab === "policies")
      setActiveTab(defaultTab);
  }, [activeCompany, activeTab, canManagePolicies, defaultTab, isCompany]);

  useEffect(() => {
    const requested = searchParams.get("tab");
    if (!requested) return;
    if (requested === activeTab) return;
    if (!tabs.some((t) => t.id === requested)) return;
    setActiveTab(requested);
  }, [activeTab, searchParams, tabs]);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white">
            Settings
          </h1>
          <p className="text-white/50 mt-1">
            Manage your account, preferences, and security settings.
          </p>
        </div>

        {/* Save button - desktop */}
        <div className="hidden sm:block">
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-primary disabled:opacity-50"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>

      {/* Success message */}
      <AnimatePresence>
        {savedMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 rounded-xl bg-emerald-400/10 border border-emerald-400/20"
          >
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-emerald-400" />
              <p className="text-emerald-400 font-medium">
                Settings saved successfully!
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar tabs */}
        <div className="lg:col-span-1">
          <div className="card p-2 space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? "bg-cyan-400/10 text-cyan-400"
                    : "text-white/50 hover:text-white hover:bg-white/5"
                }`}
              >
                <tab.icon className="w-5 h-5" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab content */}
        <div className="lg:col-span-3">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === "profile" && !isCompany && (
                <ProfileSettings user={user} />
              )}
              {activeTab === "company" && (
                <CompanySettings
                  company={activeCompany}
                  currentPolicy={policy}
                />
              )}
              {activeTab === "policies" && (
                <PoliciesSettings
                  onboarding={onboardingPolicies}
                  currentPolicy={policy}
                />
              )}
              {activeTab === "wallet" && (
                <WalletSettings walletAddress={walletAddress} />
              )}
              {activeTab === "notifications" && <NotificationSettings />}
              {activeTab === "security" && <SecuritySettings />}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Save button - mobile */}
      <div className="sm:hidden">
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full btn-primary disabled:opacity-50"
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Save Changes
            </>
          )}
        </button>
      </div>
    </div>
  );
}

function ProfileSettings({ user }: { user: any }) {
  const displayName = user?.employee?.name || "User";
  const email = user?.employee?.email || "";
  const role = user?.employee?.role || "employee";
  const walletAddress = user?.employee?.smart_wallet_address || "";

  return (
    <div className="space-y-6">
      {/* Profile header card */}
      <div className="card">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          {/* Avatar */}
          <div className="relative group">
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-cyan-400 via-purple-400 to-pink-400 p-0.5">
              <div className="w-full h-full rounded-2xl bg-navy-800 flex items-center justify-center">
                <span className="text-3xl font-bold text-white">
                  {displayName[0]?.toUpperCase() || "U"}
                </span>
              </div>
            </div>
            <button className="absolute -bottom-2 -right-2 p-2 rounded-full bg-cyan-400 text-black hover:bg-cyan-300 transition-colors shadow-lg">
              <Camera className="w-4 h-4" />
            </button>
          </div>

          {/* Profile info */}
          <div className="text-center sm:text-left flex-1">
            <h3 className="text-xl font-bold text-white">{displayName}</h3>
            <p className="text-white/50">{email}</p>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-3">
              <span
                className={`px-3 py-1 rounded-full text-xs font-medium ${
                  role === "admin"
                    ? "bg-purple-400/10 text-purple-400 border border-purple-400/20"
                    : "bg-cyan-400/10 text-cyan-400 border border-cyan-400/20"
                }`}
              >
                {role === "admin"
                  ? "Administrator"
                  : role === "manager"
                    ? "Manager"
                    : "Employee"}
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-emerald-400/10 text-emerald-400 border border-emerald-400/20">
                Verified
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Personal information */}
      <div className="card">
        <h4 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
          <User className="w-5 h-5 text-cyan-400" />
          Personal Information
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <InputField
            label="Full Name"
            icon={User}
            defaultValue={displayName}
            placeholder="Enter your name"
          />
          <InputField
            label="Email Address"
            icon={Mail}
            type="email"
            defaultValue={email}
            placeholder="Enter your email"
          />
          <InputField
            label="Phone Number"
            icon={Phone}
            type="tel"
            defaultValue="+1 (555) 123-4567"
            placeholder="Enter phone number"
          />
          <InputField
            label="Department"
            icon={Building2}
            defaultValue="Engineering"
            placeholder="Your department"
          />
        </div>
      </div>

      {/* Account Information */}
      <div className="card">
        <h4 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
          <Key className="w-5 h-5 text-cyan-400" />
          Account Information
        </h4>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-cyan-400/10 flex items-center justify-center">
                <Wallet className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <p className="text-white font-medium">Wallet Address</p>
                <code className="text-white/50 text-sm font-mono">
                  {truncateAddress(walletAddress)}
                </code>
              </div>
            </div>
            <CopyButton text={walletAddress} />
          </div>

          <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-400/10 flex items-center justify-center">
                <Globe className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <p className="text-white font-medium">Member Since</p>
                <p className="text-white/50 text-sm">January 2024</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CompanySettings({
  company,
  currentPolicy,
}: {
  company: any;
  currentPolicy: Policy | null;
}) {
  const companyName = company?.name || "Your Company";
  const identificationnumber = company?.identificationnumber || "";
  const companyEmail = company?.email || "";
  const vaultAddress = company?.smart_wallet_address || "";

  // Verification mode state
  const [verificationMode, setVerificationMode] = useState<
    "autonomous" | "human_verification"
  >("autonomous");
  const [dailyLimit, setDailyLimit] = useState(
    currentPolicy?.daily_receipt_limit || 3,
  );

  return (
    <div className="space-y-6">
      {/* Company header */}
      <div className="card">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-400/20 to-cyan-400/20 border border-white/10 flex items-center justify-center">
            <Building2 className="w-10 h-10 text-white/50" />
          </div>
          <div className="text-center sm:text-left flex-1">
            <h3 className="text-xl font-bold text-white">{companyName}</h3>
            <p className="text-white/50">{identificationnumber}</p>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-3">
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-emerald-400/10 text-emerald-400 border border-emerald-400/20">
                Active
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-cyan-400/10 text-cyan-400 border border-cyan-400/20">
                Pro Plan
              </span>
            </div>
          </div>
          <button className="btn-secondary">
            <Edit3 className="w-4 h-4" />
            Edit Logo
          </button>
        </div>
      </div>

      {/* Verification Mode - NEW SECTION */}
      <div className="card border-cyan-400/20">
        <h4 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
          <Shield className="w-5 h-5 text-cyan-400" />
          Receipt Verification Mode
        </h4>
        <p className="text-white/50 text-sm mb-6">
          Choose how receipts are verified and processed in your organization.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Autonomous Mode */}
          <button
            onClick={() => setVerificationMode("autonomous")}
            className={`p-5 rounded-xl border-2 text-left transition-all ${
              verificationMode === "autonomous"
                ? "bg-cyan-400/10 border-cyan-400/50"
                : "bg-white/[0.02] border-white/10 hover:border-white/20"
            }`}
          >
            <div className="flex items-start gap-3">
              <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  verificationMode === "autonomous"
                    ? "bg-cyan-400/20 text-cyan-400"
                    : "bg-white/5 text-white/50"
                }`}
              >
                <Zap className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h5 className="text-white font-semibold">Autonomous Mode</h5>
                  {verificationMode === "autonomous" && (
                    <CheckCircle className="w-4 h-4 text-cyan-400" />
                  )}
                </div>
                <p className="text-white/50 text-sm mt-1">
                  AI handles everything automatically. Receipts are processed
                  instantly with no human review required.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="px-2 py-1 rounded-md bg-cyan-400/10 text-cyan-400 text-xs">
                    Instant Processing
                  </span>
                  <span className="px-2 py-1 rounded-md bg-emerald-400/10 text-emerald-400 text-xs">
                    AI-Powered
                  </span>
                </div>
              </div>
            </div>
          </button>

          {/* Human Verification Mode */}
          <button
            onClick={() => setVerificationMode("human_verification")}
            className={`p-5 rounded-xl border-2 text-left transition-all ${
              verificationMode === "human_verification"
                ? "bg-purple-400/10 border-purple-400/50"
                : "bg-white/[0.02] border-white/10 hover:border-white/20"
            }`}
          >
            <div className="flex items-start gap-3">
              <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  verificationMode === "human_verification"
                    ? "bg-purple-400/20 text-purple-400"
                    : "bg-white/5 text-white/50"
                }`}
              >
                <User className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h5 className="text-white font-semibold">
                    Human Verification
                  </h5>
                  {verificationMode === "human_verification" && (
                    <CheckCircle className="w-4 h-4 text-purple-400" />
                  )}
                </div>
                <p className="text-white/50 text-sm mt-1">
                  All receipts require human review. Best for organizations
                  requiring manual approval workflows.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="px-2 py-1 rounded-md bg-purple-400/10 text-purple-400 text-xs">
                    Manual Review
                  </span>
                  <span className="px-2 py-1 rounded-md bg-amber-400/10 text-amber-400 text-xs">
                    Full Control
                  </span>
                </div>
              </div>
            </div>
          </button>
        </div>

        {/* Daily Receipt Limit */}
        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h5 className="text-white font-medium flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-cyan-400" />
                Daily Receipt Limit per Employee
              </h5>
              <p className="text-white/50 text-sm mt-1">
                Maximum number of receipts an employee can upload per day.
                {verificationMode === "human_verification" && (
                  <span className="text-amber-400">
                    {" "}
                    Default is 3 for human verification mode.
                  </span>
                )}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setDailyLimit(Math.max(1, dailyLimit - 1))}
                className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-colors flex items-center justify-center"
              >
                -
              </button>
              <div className="w-20 text-center">
                <span className="text-2xl font-bold text-white">
                  {dailyLimit}
                </span>
                <p className="text-white/30 text-xs">/day</p>
              </div>
              <button
                onClick={() => setDailyLimit(Math.min(50, dailyLimit + 1))}
                className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-colors flex items-center justify-center"
              >
                +
              </button>
            </div>
          </div>
        </div>

        {/* Info note */}
        <div className="mt-4 p-3 rounded-lg bg-amber-400/5 border border-amber-400/20">
          <p className="text-amber-400/80 text-xs flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>
              When the daily limit is reached, employees cannot upload more
              receipts until the next day. This applies to both verification
              modes.
            </span>
          </p>
        </div>
      </div>

      {/* Company details */}
      <div className="card">
        <h4 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
          <Building2 className="w-5 h-5 text-cyan-400" />
          Company Details
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <InputField
            label="Company Name"
            icon={Building2}
            defaultValue={companyName}
            placeholder="Company name"
          />
          <InputField
            label="Company Email"
            icon={Mail}
            type="email"
            defaultValue={companyEmail}
            placeholder="Company email"
          />
          <div className="md:col-span-2">
            <InputField
              label="Identification Number"
              icon={MapPin}
              defaultValue={identificationnumber}
              placeholder="Identification Number"
            />
          </div>
        </div>
      </div>

      {/* Treasury vault */}
      <div className="card">
        <h4 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
          <Wallet className="w-5 h-5 text-cyan-400" />
          Treasury Vault
        </h4>

        <div className="p-4 rounded-xl bg-gradient-to-r from-cyan-400/5 to-purple-400/5 border border-cyan-400/20">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-white/50 text-sm mb-1">Vault Address</p>
              <code className="text-white font-mono">
                {truncateAddress(vaultAddress)}
              </code>
            </div>
            <div className="flex items-center gap-2">
              <CopyButton text={vaultAddress} />
              <a
                href={`https://testnet.snowtrace.io/address/${vaultAddress}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg bg-white/5 text-white/50 hover:text-cyan-400 hover:bg-cyan-400/10 transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Expense policy */}
      <div className="card">
        <h4 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-cyan-400" />
          Expense Policy Defaults
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-white/70 text-sm font-medium mb-2">
              Max Amount per Receipt (USD)
            </p>
            <div className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white/80">
              {currentPolicy?.amount_cap == null
                ? "Not set"
                : `$${currentPolicy.amount_cap}`}
            </div>
          </div>
          <div>
            <p className="text-white/70 text-sm font-medium mb-2">
              Monthly Limit (USD)
            </p>
            <div className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white/80">
              {currentPolicy?.monthly_cap == null
                ? "Not set"
                : `$${currentPolicy.monthly_cap}`}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PoliciesSettings({
  onboarding,
  currentPolicy,
}: {
  onboarding: boolean;
  currentPolicy: Policy | null;
}) {
  const { company, employee, isCompany, loading, errors, refreshProfile } =
    useProfile();
  const canManagePolicies =
    isCompany ||
    employee?.employee_role === "admin" ||
    employee?.employee_role === "manager";
  const role = employee?.employee_role || "employee";
  const authz = isCompany
    ? { accountType: "company" as const }
    : { accountType: "employee" as const, employeeRole: role };
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<PolicyRequest>({
    name: "",
    verification_mode: "autonomous",
    daily_receipt_limit: 0,
    currencies: ["USD"],
    amount_cap: 0,
    monthly_cap: 0,
    max_days_old: 0,
    auto_approve_under: 0,
    require_category: false,
    require_description: false,
    allowed_categories: [],
    vendor_whitelist: [],
    vendor_blacklist: [],
    custom_rules: "",
    is_active: false,
  });
  const [message, setMessage] = useState<{
    type: "ok" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    if (!currentPolicy) return;
    setForm({
      name: currentPolicy.name || "",
      verification_mode:
        (currentPolicy.verification_mode as any) || "autonomous",
      daily_receipt_limit: currentPolicy.daily_receipt_limit ?? 3,
      currencies: currentPolicy.currencies ?? ["USD"],
      amount_cap:
        currentPolicy.amount_cap == null ? 0 : Number(currentPolicy.amount_cap),
      monthly_cap:
        currentPolicy.monthly_cap == null
          ? undefined
          : Number(currentPolicy.monthly_cap),
      max_days_old: currentPolicy.max_days_old ?? 30,
      auto_approve_under:
        currentPolicy.auto_approve_under == null
          ? 0
          : Number(currentPolicy.auto_approve_under),
      require_category: currentPolicy.require_category ?? false,
      require_description: currentPolicy.require_description ?? false,
      allowed_categories: currentPolicy.allowed_categories ?? [],
      vendor_whitelist: currentPolicy.vendor_whitelist ?? [],
      vendor_blacklist: currentPolicy.vendor_blacklist ?? [],
      custom_rules: currentPolicy.custom_rules ?? "",
      is_active: currentPolicy.is_active ?? true,
    });
  }, [currentPolicy]);

  const updateForm = (key: keyof PolicyRequest, value: any) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    if (!canManagePolicies) {
      setMessage({ type: "error", text: "Access denied" });
      return;
    }
    setSaving(true);
    setMessage(null);
    if (!currentPolicy?.id) {
      const response = await policyApi.create(form, authz);
      if (response.success && response.data) {
        await refreshProfile();
        setMessage({ type: "ok", text: "Policy created" });
      } else {
        setMessage({
          type: "error",
          text: response.error?.message || "Create failed",
        });
      }
    } else {
      const response = await policyApi.update(currentPolicy.id, form, authz);
      if (response.success && response.data) {
        await refreshProfile();
        setMessage({ type: "ok", text: "Policy saved" });
      } else {
        setMessage({
          type: "error",
          text: response.error?.message || "Save failed",
        });
      }
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!currentPolicy?.id) return;
    if (!canManagePolicies) {
      setMessage({ type: "error", text: "Access denied" });
      return;
    }
    setSaving(true);
    setMessage(null);
    const response = await policyApi.delete(currentPolicy.id, authz);
    if (response.success) {
      await refreshProfile();
      setMessage({ type: "ok", text: "Policy deleted" });
    } else {
      setMessage({
        type: "error",
        text: response.error?.message || "Delete failed",
      });
    }
    setSaving(false);
  };

  const requiredOk =
    Boolean(form.name?.trim()) &&
    Array.isArray(form.currencies) &&
    form.currencies.length > 0 &&
    typeof form.amount_cap === "number" &&
    form.amount_cap > 0 &&
    typeof form.max_days_old === "number" &&
    form.max_days_old >= 1 &&
    Array.isArray(form.allowed_categories) &&
    Array.isArray(form.vendor_whitelist) &&
    Array.isArray(form.vendor_blacklist) &&
    typeof form.auto_approve_under === "number" &&
    form.auto_approve_under >= 0 &&
    typeof form.require_category === "boolean" &&
    typeof form.require_description === "boolean" &&
    typeof form.is_active === "boolean" &&
    typeof form.custom_rules === "string";

  const canSave = canManagePolicies && requiredOk;
  const showNoPolicies =
    Boolean(company?.id) && !loading && !errors?.policy && !currentPolicy;

  if (!company?.id) {
    return (
      <div className="card">
        <p className="text-white/60">Join a company to manage policies.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {onboarding && (
        <div
          className={`p-4 rounded-xl border ${
            requiredOk
              ? "bg-emerald-400/10 border-emerald-400/20 text-emerald-400"
              : "bg-amber-400/10 border-amber-400/20 text-amber-400"
          }`}
        >
          <p className="font-medium">
            {requiredOk
              ? "Policies configured. You can continue using the dashboard."
              : "Complete policy setup to start reimbursing receipts."}
          </p>
        </div>
      )}
      <div className="card">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-white">
              Expense Policies
            </h3>
            <p className="text-white/50 text-sm">
              Configure verification mode and limits for reimbursements.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              disabled={saving || loading || !canSave}
              onClick={handleSave}
              className="btn-primary disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {message && (
        <div
          className={`p-4 rounded-xl border ${
            message.type === "ok"
              ? "bg-emerald-400/10 border-emerald-400/20 text-emerald-400"
              : "bg-red-400/10 border-red-400/20 text-red-400"
          }`}
        >
          <p className="font-medium">{message.text}</p>
        </div>
      )}

      {errors?.policy && (
        <div className="p-4 rounded-xl border bg-red-400/10 border-red-400/20 text-red-400">
          <p className="font-medium">{errors.policy.message}</p>
        </div>
      )}

      {showNoPolicies && (
        <div className="p-4 rounded-xl border bg-amber-400/10 border-amber-400/20 text-amber-400">
          <p className="font-medium">There is no configured policy.</p>
        </div>
      )}

      <div className="card space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-white/70 text-sm font-medium mb-2">
              Name
            </label>
            <input
              value={form.name || ""}
              onChange={(e) => updateForm("name", e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-cyan-400/50 transition-colors"
            />
          </div>
          <div>
            <label className="block text-white/70 text-sm font-medium mb-2">
              Verification Mode
            </label>
            <select
              value={String(form.verification_mode || "autonomous")}
              onChange={(e) => updateForm("verification_mode", e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-cyan-400/50 transition-colors"
            >
              <option value="autonomous">autonomous</option>
              <option value="human_verification">human_verification</option>
            </select>
          </div>
          <div>
            <label className="block text-white/70 text-sm font-medium mb-2">
              Daily Receipt Limit
            </label>
            <input
              type="number"
              value={form.daily_receipt_limit ?? ""}
              onChange={(e) =>
                updateForm(
                  "daily_receipt_limit",
                  e.target.value === "" ? undefined : Number(e.target.value),
                )
              }
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-cyan-400/50 transition-colors"
            />
          </div>
          <div>
            <label className="block text-white/70 text-sm font-medium mb-2">
              Amount Cap (USD)
            </label>
            <input
              type="number"
              value={form.amount_cap ?? ""}
              onChange={(e) =>
                updateForm(
                  "amount_cap",
                  e.target.value === "" ? undefined : Number(e.target.value),
                )
              }
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-cyan-400/50 transition-colors"
            />
          </div>
          <div>
            <label className="block text-white/70 text-sm font-medium mb-2">
              Monthly Cap (USD)
            </label>
            <input
              type="number"
              value={form.monthly_cap ?? ""}
              onChange={(e) =>
                updateForm(
                  "monthly_cap",
                  e.target.value === "" ? undefined : Number(e.target.value),
                )
              }
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-cyan-400/50 transition-colors"
            />
          </div>
          <div>
            <label className="block text-white/70 text-sm font-medium mb-2">
              Max Days Old
            </label>
            <input
              type="number"
              value={form.max_days_old ?? ""}
              onChange={(e) =>
                updateForm(
                  "max_days_old",
                  e.target.value === "" ? undefined : Number(e.target.value),
                )
              }
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-cyan-400/50 transition-colors"
            />
          </div>
          <div>
            <label className="block text-white/70 text-sm font-medium mb-2">
              Auto-Approve Under (USD)
            </label>
            <input
              type="number"
              value={form.auto_approve_under ?? ""}
              onChange={(e) =>
                updateForm(
                  "auto_approve_under",
                  e.target.value === "" ? undefined : Number(e.target.value),
                )
              }
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-cyan-400/50 transition-colors"
            />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-white/60 text-sm">
            <input
              type="checkbox"
              checked={Boolean(form.require_category)}
              onChange={(e) => updateForm("require_category", e.target.checked)}
              className="accent-cyan-400"
            />
            Require category
          </label>
          <label className="flex items-center gap-2 text-white/60 text-sm">
            <input
              type="checkbox"
              checked={Boolean(form.require_description)}
              onChange={(e) =>
                updateForm("require_description", e.target.checked)
              }
              className="accent-cyan-400"
            />
            Require description
          </label>
          <label className="flex items-center gap-2 text-white/60 text-sm">
            <input
              type="checkbox"
              checked={Boolean(form.is_active)}
              onChange={(e) => updateForm("is_active", e.target.checked)}
              className="accent-cyan-400"
            />
            Active
          </label>
        </div>

        <div>
          <label className="block text-white/70 text-sm font-medium mb-2">
            Custom Rules
          </label>
          <textarea
            value={String(form.custom_rules || "")}
            onChange={(e) => updateForm("custom_rules", e.target.value)}
            rows={4}
            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-cyan-400/50 transition-colors"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-white/70 text-sm font-medium mb-2">
              Currencies (comma-separated)
            </label>
            <input
              value={(form.currencies || []).join(", ")}
              onChange={(e) =>
                updateForm(
                  "currencies",
                  e.target.value
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean),
                )
              }
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-cyan-400/50 transition-colors"
            />
          </div>
          <div />
          <div>
            <label className="block text-white/70 text-sm font-medium mb-2">
              Allowed Categories (comma-separated)
            </label>
            <textarea
              value={(form.allowed_categories || []).join(", ")}
              onChange={(e) =>
                updateForm(
                  "allowed_categories",
                  e.target.value
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean),
                )
              }
              rows={3}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-cyan-400/50 transition-colors"
            />
          </div>
          <div>
            <label className="block text-white/70 text-sm font-medium mb-2">
              Vendor Whitelist (comma-separated)
            </label>
            <textarea
              value={(form.vendor_whitelist || []).join(", ")}
              onChange={(e) =>
                updateForm(
                  "vendor_whitelist",
                  e.target.value
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean),
                )
              }
              rows={3}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-cyan-400/50 transition-colors"
            />
          </div>
          <div>
            <label className="block text-white/70 text-sm font-medium mb-2">
              Vendor Blacklist (comma-separated)
            </label>
            <textarea
              value={(form.vendor_blacklist || []).join(", ")}
              onChange={(e) =>
                updateForm(
                  "vendor_blacklist",
                  e.target.value
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean),
                )
              }
              rows={3}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-cyan-400/50 transition-colors"
            />
          </div>
        </div>

        <div className="flex items-center justify-between gap-4">
          <p className="text-white/40 text-sm">
            Company: {truncateAddress(company.id)}
          </p>
          <button
            disabled={saving || !currentPolicy?.id || !canManagePolicies}
            onClick={handleDelete}
            className="px-4 py-2 rounded-lg bg-red-400/10 text-red-400 text-sm font-medium hover:bg-red-400/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

function WalletSettings({ walletAddress }: { walletAddress: string | null }) {
  const address = walletAddress || "";

  return (
    <div className="space-y-6">
      {/* Connected wallet */}
      <div className="card">
        <h4 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
          <Wallet className="w-5 h-5 text-cyan-400" />
          Connected Wallet
        </h4>

        <div className="p-6 rounded-xl bg-gradient-to-br from-cyan-400/10 via-purple-400/5 to-pink-400/10 border border-cyan-400/20">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center">
              <Wallet className="w-8 h-8 text-white" />
            </div>
            <div className="text-center sm:text-left flex-1">
              <p className="text-white font-semibold text-lg">
                {"Accout Wallet"}
              </p>
              <code className="text-white/60 text-sm font-mono block mt-1">
                {address}
              </code>
            </div>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-400/10 text-emerald-400 text-sm">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Connected
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Network info */}
      <div className="card">
        <h4 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
          <Globe className="w-5 h-5 text-cyan-400" />
          Network Information
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <InfoCard
            icon={Globe}
            label="Network"
            value="Celo Sepolia"
            color="cyan"
          />
          <InfoCard
            icon={CreditCard}
            label="Token"
            value="USDC"
            color="emerald"
          />
          <InfoCard
            icon={Key}
            label="Chain ID"
            value="11142220"
            color="purple"
          />
          <InfoCard
            icon={Shield}
            label="Status"
            value="Testnet"
            color="amber"
          />
        </div>
      </div>

      {/* Wallet actions */}
      <div className="card">
        <h4 className="text-lg font-semibold text-white mb-6">
          Wallet Actions
        </h4>

        <div className="space-y-3">
          <a
            href={`https://sepolia.celoscan.io/address/${address}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/10 hover:border-cyan-400/30 hover:bg-cyan-400/5 transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-cyan-400/10 flex items-center justify-center">
                <ExternalLink className="w-5 h-5 text-cyan-400" />
              </div>
              <div className="text-left">
                <p className="text-white font-medium">View on Explorer</p>
                <p className="text-white/40 text-sm">
                  See transaction history on Snowtrace
                </p>
              </div>
            </div>
            <ExternalLink className="w-5 h-5 text-white/30 group-hover:text-cyan-400 transition-colors" />
          </a>

          <button className="w-full flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/10 hover:border-purple-400/30 hover:bg-purple-400/5 transition-all group">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-400/10 flex items-center justify-center">
                <Wallet className="w-5 h-5 text-purple-400" />
              </div>
              <div className="text-left">
                <p className="text-white font-medium">
                  Connect Additional Wallet
                </p>
                <p className="text-white/40 text-sm">
                  Link another wallet for receiving payouts
                </p>
              </div>
            </div>
            <ExternalLink className="w-5 h-5 text-white/30 group-hover:text-purple-400 transition-colors" />
          </button>
        </div>
      </div>
    </div>
  );
}

function NotificationSettings() {
  const [settings, setSettings] = useState({
    emailApproved: true,
    emailRejected: true,
    emailPayout: true,
    emailWeekly: false,
    pushApproved: true,
    pushRejected: true,
    pushPayout: true,
  });

  const toggleSetting = (key: keyof typeof settings) => {
    setSettings({ ...settings, [key]: !settings[key] });
  };

  return (
    <div className="space-y-6">
      {/* Email notifications */}
      <div className="card">
        <h4 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
          <Mail className="w-5 h-5 text-cyan-400" />
          Email Notifications
        </h4>

        <div className="space-y-4">
          <ToggleItem
            title="Expense Approved"
            description="Get notified when your expense is approved by AI"
            enabled={settings.emailApproved}
            onToggle={() => toggleSetting("emailApproved")}
          />
          <ToggleItem
            title="Expense Rejected"
            description="Get notified when your expense is flagged or rejected"
            enabled={settings.emailRejected}
            onToggle={() => toggleSetting("emailRejected")}
          />
          <ToggleItem
            title="Payout Received"
            description="Get notified when USDC is sent to your wallet"
            enabled={settings.emailPayout}
            onToggle={() => toggleSetting("emailPayout")}
          />
          <ToggleItem
            title="Weekly Summary"
            description="Receive a weekly digest of all expense activity"
            enabled={settings.emailWeekly}
            onToggle={() => toggleSetting("emailWeekly")}
          />
        </div>
      </div>

      {/* Push notifications */}
      <div className="card">
        <h4 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
          <Smartphone className="w-5 h-5 text-cyan-400" />
          Push Notifications
        </h4>

        <div className="space-y-4">
          <ToggleItem
            title="Real-time Approvals"
            description="Instant notification when expenses are approved"
            enabled={settings.pushApproved}
            onToggle={() => toggleSetting("pushApproved")}
          />
          <ToggleItem
            title="Real-time Rejections"
            description="Instant notification when expenses are rejected"
            enabled={settings.pushRejected}
            onToggle={() => toggleSetting("pushRejected")}
          />
          <ToggleItem
            title="Payout Alerts"
            description="Instant notification when you receive USDC"
            enabled={settings.pushPayout}
            onToggle={() => toggleSetting("pushPayout")}
          />
        </div>
      </div>
    </div>
  );
}

function SecuritySettings() {
  return (
    <div className="space-y-6">
      {/* Security status */}
      <div className="card bg-gradient-to-br from-emerald-400/5 to-cyan-400/5 border-emerald-400/20">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-400/20 flex items-center justify-center">
            <Shield className="w-7 h-7 text-emerald-400" />
          </div>
          <div>
            <h4 className="text-lg font-semibold text-white">
              Account Security: Strong
            </h4>
            <p className="text-white/50 text-sm mt-0.5">
              Your account is protected with wallet authentication
            </p>
          </div>
        </div>
      </div>

      {/* Security options */}
      <div className="card">
        <h4 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
          <Shield className="w-5 h-5 text-cyan-400" />
          Security Options
        </h4>

        <div className="space-y-3">
          <SecurityOption
            icon={Key}
            title="Two-Factor Authentication"
            description="Add an extra layer of security with authenticator app"
            action="Enable"
            color="cyan"
          />
          <SecurityOption
            icon={Monitor}
            title="Active Sessions"
            description="View and manage devices logged into your account"
            action="Manage"
            color="purple"
          />
          <SecurityOption
            icon={Wallet}
            title="Connected Wallets"
            description="Manage wallets linked to your account"
            action="View"
            color="emerald"
          />
          <SecurityOption
            icon={Bell}
            title="Security Alerts"
            description="Get notified about suspicious activity"
            action="Configure"
            color="amber"
          />
        </div>
      </div>

      {/* Danger zone */}
      <div className="card border-red-400/20">
        <h4 className="text-lg font-semibold text-red-400 mb-6 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" />
          Danger Zone
        </h4>

        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-red-400/5 border border-red-400/10">
            <div>
              <p className="text-white font-medium">Sign Out Everywhere</p>
              <p className="text-white/40 text-sm">
                Sign out from all devices and sessions
              </p>
            </div>
            <button className="px-4 py-2 rounded-lg bg-red-400/10 text-red-400 text-sm font-medium hover:bg-red-400/20 transition-colors flex items-center gap-2">
              <LogOut className="w-4 h-4" />
              Sign Out All
            </button>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-red-400/5 border border-red-400/10">
            <div>
              <p className="text-white font-medium">Delete Account</p>
              <p className="text-white/40 text-sm">
                Permanently delete your account and all data
              </p>
            </div>
            <button className="px-4 py-2 rounded-lg bg-red-400/10 text-red-400 text-sm font-medium hover:bg-red-400/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
              <Trash2 className="w-4 h-4" />
              Delete Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper components
function InputField({
  label,
  icon: Icon,
  type = "text",
  defaultValue,
  placeholder,
}: {
  label: string;
  icon: any;
  type?: string;
  defaultValue?: string;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-white/70 text-sm font-medium mb-2">
        {label}
      </label>
      <div className="relative">
        <Icon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
        <input
          type={type}
          defaultValue={defaultValue}
          placeholder={placeholder}
          className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-cyan-400/50 transition-colors"
          suppressHydrationWarning
        />
      </div>
    </div>
  );
}

function InfoCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: any;
  label: string;
  value: string;
  color: "cyan" | "emerald" | "purple" | "amber";
}) {
  const colors = {
    cyan: "bg-cyan-400/10 text-cyan-400",
    emerald: "bg-emerald-400/10 text-emerald-400",
    purple: "bg-purple-400/10 text-purple-400",
    amber: "bg-amber-400/10 text-amber-400",
  };

  return (
    <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
      <div className="flex items-center gap-3">
        <div
          className={`w-10 h-10 rounded-lg flex items-center justify-center ${colors[color]}`}
        >
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <p className="text-white/40 text-sm">{label}</p>
          <p className="text-white font-medium">{value}</p>
        </div>
      </div>
    </div>
  );
}

function ToggleItem({
  title,
  description,
  enabled,
  onToggle,
}: {
  title: string;
  description: string;
  enabled: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors">
      <div>
        <p className="text-white font-medium">{title}</p>
        <p className="text-white/40 text-sm">{description}</p>
      </div>
      <button
        onClick={onToggle}
        className={`relative w-14 h-7 rounded-full transition-colors ${
          enabled ? "bg-cyan-400" : "bg-white/10"
        }`}
        suppressHydrationWarning
      >
        <motion.div
          animate={{ x: enabled ? 28 : 4 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
          className="absolute top-1 w-5 h-5 rounded-full bg-white shadow-md"
        />
      </button>
    </div>
  );
}

function SecurityOption({
  icon: Icon,
  title,
  description,
  action,
  color,
}: {
  icon: any;
  title: string;
  description: string;
  action: string;
  color: "cyan" | "emerald" | "purple" | "amber";
}) {
  const colors = {
    cyan: "bg-cyan-400/10 text-cyan-400 hover:bg-cyan-400/20",
    emerald: "bg-emerald-400/10 text-emerald-400 hover:bg-emerald-400/20",
    purple: "bg-purple-400/10 text-purple-400 hover:bg-purple-400/20",
    amber: "bg-amber-400/10 text-amber-400 hover:bg-amber-400/20",
  };

  const iconColors = {
    cyan: "bg-cyan-400/10 text-cyan-400",
    emerald: "bg-emerald-400/10 text-emerald-400",
    purple: "bg-purple-400/10 text-purple-400",
    amber: "bg-amber-400/10 text-amber-400",
  };

  return (
    <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all">
      <div className="flex items-center gap-4">
        <div
          className={`w-10 h-10 rounded-lg flex items-center justify-center ${iconColors[color]}`}
        >
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <p className="text-white font-medium">{title}</p>
          <p className="text-white/40 text-sm">{description}</p>
        </div>
      </div>
      <button
        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${colors[color]}`}
      >
        {action}
      </button>
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="p-2 rounded-lg bg-white/5 text-white/50 hover:text-white hover:bg-white/10 transition-colors"
    >
      {copied ? (
        <Check className="w-4 h-4 text-emerald-400" />
      ) : (
        <Copy className="w-4 h-4" />
      )}
    </button>
  );
}
