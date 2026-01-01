"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import {
  User,
  Building2,
  Bell,
  Shield,
  Wallet,
  Moon,
  Sun,
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
} from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { truncateAddress } from "@/lib/utils";

export default function SettingsPage() {
  const { user, isDemo, activeCompany, walletAddress, disableDemoMode, logout } = useAuth();
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");
  const [savedMessage, setSavedMessage] = useState(false);

  const handleSave = async () => {
    if (isDemo) return;
    setSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setSaving(false);
    setSavedMessage(true);
    setTimeout(() => setSavedMessage(false), 3000);
  };

  const tabs = [
    { id: "profile", label: "Profile", icon: User },
    { id: "company", label: "Company", icon: Building2 },
    { id: "wallet", label: "Wallet", icon: Wallet },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "security", label: "Security", icon: Shield },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white">Settings</h1>
          <p className="text-white/50 mt-1">
            Manage your account, preferences, and security settings.
          </p>
        </div>
        
        {/* Save button - desktop */}
        <div className="hidden sm:block">
          <button
            onClick={handleSave}
            disabled={saving || isDemo}
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

      {/* Demo mode notice */}
      {isDemo && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-xl bg-gradient-to-r from-amber-400/10 to-orange-400/10 border border-amber-400/20"
        >
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-amber-400 font-medium">Demo Mode Active</p>
              <p className="text-amber-400/70 text-sm mt-0.5">
                You're viewing simulated data. Changes won't be saved. Connect a wallet to access your real account.
              </p>
            </div>
          </div>
        </motion.div>
      )}

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
              <p className="text-emerald-400 font-medium">Settings saved successfully!</p>
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
              {activeTab === "profile" && <ProfileSettings user={user} isDemo={isDemo} />}
              {activeTab === "company" && <CompanySettings company={activeCompany} isDemo={isDemo} />}
              {activeTab === "wallet" && <WalletSettings walletAddress={walletAddress} isDemo={isDemo} />}
              {activeTab === "notifications" && <NotificationSettings />}
              {activeTab === "security" && <SecuritySettings isDemo={isDemo} />}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Save button - mobile */}
      <div className="sm:hidden">
        <button
          onClick={handleSave}
          disabled={saving || isDemo}
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

function ProfileSettings({ user, isDemo }: { user: any; isDemo: boolean }) {
  const displayName = isDemo ? "Demo User" : user?.employee?.name || "User";
  const email = isDemo ? "demo@reimburseai.app" : user?.employee?.email || "";
  const role = isDemo ? "admin" : user?.employee?.role || "employee";
  const walletAddress = isDemo ? "0x742d35Cc6634C0532925a3b844Bc9e7595f36E4B" : user?.employee?.wallet_address || "";

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
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                role === "admin" 
                  ? "bg-purple-400/10 text-purple-400 border border-purple-400/20" 
                  : "bg-cyan-400/10 text-cyan-400 border border-cyan-400/20"
              }`}>
                {role === "admin" ? "Administrator" : role === "manager" ? "Manager" : "Employee"}
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
                <code className="text-white/50 text-sm font-mono">{truncateAddress(walletAddress)}</code>
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

function CompanySettings({ company, isDemo }: { company: any; isDemo: boolean }) {
  const companyName = isDemo ? "Demo Corporation" : company?.name || "Your Company";
  const companySlug = isDemo ? "demo-corp" : company?.slug || "";
  const companyEmail = isDemo ? "admin@democorp.com" : company?.email || "";
  const vaultAddress = isDemo ? "0x9D86Af1Fe77969caD642c926CA81447399c1606C" : company?.vault_address || "";

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
            <p className="text-white/50">@{companySlug}</p>
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
              label="Company Address"
              icon={MapPin}
              defaultValue="123 Business Ave, San Francisco, CA 94102"
              placeholder="Company address"
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
              <code className="text-white font-mono">{truncateAddress(vaultAddress)}</code>
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
            <label className="block text-white/70 text-sm font-medium mb-2">
              Daily Limit (USD)
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30">$</span>
              <input
                type="number"
                defaultValue="500"
                className="w-full pl-8 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-cyan-400/50 transition-colors"
              />
            </div>
          </div>
          <div>
            <label className="block text-white/70 text-sm font-medium mb-2">
              Monthly Limit (USD)
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30">$</span>
              <input
                type="number"
                defaultValue="5000"
                className="w-full pl-8 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-cyan-400/50 transition-colors"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function WalletSettings({ walletAddress, isDemo }: { walletAddress: string | null; isDemo: boolean }) {
  const address = isDemo ? "0x742d35Cc6634C0532925a3b844Bc9e7595f36E4B" : walletAddress || "";
  
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
                {isDemo ? "Demo Wallet" : "MetaMask"}
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
            value="Avalanche Fuji"
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
            value="43113"
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
        <h4 className="text-lg font-semibold text-white mb-6">Wallet Actions</h4>
        
        <div className="space-y-3">
          <a 
            href={`https://testnet.snowtrace.io/address/${address}`}
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
                <p className="text-white/40 text-sm">See transaction history on Snowtrace</p>
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
                <p className="text-white font-medium">Connect Additional Wallet</p>
                <p className="text-white/40 text-sm">Link another wallet for receiving payouts</p>
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

function SecuritySettings({ isDemo }: { isDemo: boolean }) {
  return (
    <div className="space-y-6">
      {/* Security status */}
      <div className="card bg-gradient-to-br from-emerald-400/5 to-cyan-400/5 border-emerald-400/20">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-400/20 flex items-center justify-center">
            <Shield className="w-7 h-7 text-emerald-400" />
          </div>
          <div>
            <h4 className="text-lg font-semibold text-white">Account Security: Strong</h4>
            <p className="text-white/50 text-sm mt-0.5">Your account is protected with wallet authentication</p>
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
              <p className="text-white/40 text-sm">Sign out from all devices and sessions</p>
            </div>
            <button className="px-4 py-2 rounded-lg bg-red-400/10 text-red-400 text-sm font-medium hover:bg-red-400/20 transition-colors flex items-center gap-2">
              <LogOut className="w-4 h-4" />
              Sign Out All
            </button>
          </div>
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-red-400/5 border border-red-400/10">
            <div>
              <p className="text-white font-medium">Delete Account</p>
              <p className="text-white/40 text-sm">Permanently delete your account and all data</p>
            </div>
            <button 
              disabled={isDemo}
              className="px-4 py-2 rounded-lg bg-red-400/10 text-red-400 text-sm font-medium hover:bg-red-400/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
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
      <label className="block text-white/70 text-sm font-medium mb-2">{label}</label>
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
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colors[color]}`}>
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
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${iconColors[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <p className="text-white font-medium">{title}</p>
          <p className="text-white/40 text-sm">{description}</p>
        </div>
      </div>
      <button className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${colors[color]}`}>
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
