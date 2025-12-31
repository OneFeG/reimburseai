"use client";

import { useState } from "react";
import { motion } from "framer-motion";
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
} from "lucide-react";
import { useAuth } from "@/context/auth-context";

export default function SettingsPage() {
  const { user, isDemo } = useAuth();
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");

  const handleSave = async () => {
    setSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setSaving(false);
  };

  const tabs = [
    { id: "profile", label: "Profile", icon: User },
    { id: "company", label: "Company", icon: Building2 },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "security", label: "Security", icon: Shield },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-white">Settings</h1>
        <p className="text-white/50 mt-1">
          Manage your account and preferences.
        </p>
      </div>

      {/* Demo mode notice */}
      {isDemo && (
        <div className="p-4 rounded-xl bg-amber-400/10 border border-amber-400/20">
          <p className="text-amber-400 text-sm">
            <strong>Demo Mode:</strong> Settings changes won't be saved in demo mode.
          </p>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
              activeTab === tab.id
                ? "bg-cyan-400/10 text-cyan-400 border border-cyan-400/30"
                : "text-white/50 hover:text-white hover:bg-white/5"
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="card">
        {activeTab === "profile" && <ProfileSettings user={user} />}
        {activeTab === "company" && <CompanySettings />}
        {activeTab === "notifications" && <NotificationSettings />}
        {activeTab === "security" && <SecuritySettings />}
      </div>

      {/* Save button */}
      <div className="flex justify-end">
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
  );
}

function ProfileSettings({ user }: { user: any }) {
  const [name, setName] = useState(user?.employee?.name || "Demo User");
  const [email, setEmail] = useState(user?.employee?.email || "demo@reimburseai.app");
  const companies = user?.memberships || [];
  const [companyId, setCompanyId] = useState(user?.activeCompanyId || companies[0]?.company_id || "");

  const copyWallet = async () => {
    try {
      await navigator.clipboard.writeText(user?.employee?.wallet_address || "");
      // small feedback could be added
    } catch (err) {
      // ignore
    }
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-white">Profile Settings</h3>

      {/* Avatar & summary */}
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-cyan-400 to-purple-400 flex items-center justify-center text-white font-bold text-2xl">
          {user?.employee?.name?.[0]?.toUpperCase() || "D"}
        </div>
        <div>
          <p className="text-white font-medium">{user?.employee?.name || "Demo User"}</p>
          <p className="text-white/40 text-sm">{user?.employee?.email || "demo@reimburseai.app"}</p>
          <p className="text-white/30 text-xs mt-1">{user?.company?.name || "No company selected"}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-white/70 text-sm font-medium mb-2">Display Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-cyan-400/50"
          />
        </div>

        <div>
          <label className="block text-white/70 text-sm font-medium mb-2">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-cyan-400/50"
          />
        </div>

        <div className="relative">
          <label className="block text-white/70 text-sm font-medium mb-2">Wallet Address</label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={user?.employee?.wallet_address || "0xDEMO...USER"}
              disabled
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white/50 cursor-not-allowed"
            />
            <button
              onClick={copyWallet}
              className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 transition-colors"
            >
              Copy
            </button>
          </div>
        </div>

        <div>
          <label className="block text-white/70 text-sm font-medium mb-2">Company</label>
          <select
            value={companyId}
            onChange={(e) => setCompanyId(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-cyan-400/50"
          >
            {companies.length === 0 && <option value="">No companies</option>}
            {companies.map((c: any) => (
              <option key={c.company_id} value={c.company_id}>{c.company_name}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}

function CompanySettings() {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-white">Company Settings</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-white/70 text-sm font-medium mb-2">
            Company Name
          </label>
          <input
            type="text"
            defaultValue="Demo Company Inc."
            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-cyan-400/50"
          />
        </div>
        <div>
          <label className="block text-white/70 text-sm font-medium mb-2">
            Industry
          </label>
          <select className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-cyan-400/50">
            <option value="tech">Technology</option>
            <option value="finance">Finance</option>
            <option value="healthcare">Healthcare</option>
            <option value="retail">Retail</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div className="md:col-span-2">
          <label className="block text-white/70 text-sm font-medium mb-2">
            Company Address
          </label>
          <textarea
            defaultValue="123 Demo Street, San Francisco, CA 94102"
            rows={2}
            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-cyan-400/50 resize-none"
          />
        </div>
      </div>

      <div className="pt-4 border-t border-white/10">
        <h4 className="text-white font-medium mb-4">Expense Policy Defaults</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-white/70 text-sm font-medium mb-2">
              Daily Limit (USD)
            </label>
            <input
              type="number"
              defaultValue="500"
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-cyan-400/50"
            />
          </div>
          <div>
            <label className="block text-white/70 text-sm font-medium mb-2">
              Monthly Limit (USD)
            </label>
            <input
              type="number"
              defaultValue="5000"
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-cyan-400/50"
            />
          </div>
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
    pushApproved: false,
    pushRejected: true,
    pushPayout: true,
  });

  const toggleSetting = (key: keyof typeof settings) => {
    setSettings({ ...settings, [key]: !settings[key] });
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-white">Notification Settings</h3>

      <div className="space-y-4">
        <h4 className="text-white/70 text-sm font-medium">Email Notifications</h4>
        <NotificationToggle
          label="Expense Approved"
          description="Get notified when your expense is approved"
          enabled={settings.emailApproved}
          onToggle={() => toggleSetting("emailApproved")}
        />
        <NotificationToggle
          label="Expense Rejected"
          description="Get notified when your expense is rejected"
          enabled={settings.emailRejected}
          onToggle={() => toggleSetting("emailRejected")}
        />
        <NotificationToggle
          label="Payout Received"
          description="Get notified when USDC is sent to your wallet"
          enabled={settings.emailPayout}
          onToggle={() => toggleSetting("emailPayout")}
        />
      </div>

      <div className="space-y-4 pt-4 border-t border-white/10">
        <h4 className="text-white/70 text-sm font-medium">Push Notifications</h4>
        <NotificationToggle
          label="Expense Approved"
          description="Real-time notification for approvals"
          enabled={settings.pushApproved}
          onToggle={() => toggleSetting("pushApproved")}
        />
        <NotificationToggle
          label="Expense Rejected"
          description="Real-time notification for rejections"
          enabled={settings.pushRejected}
          onToggle={() => toggleSetting("pushRejected")}
        />
        <NotificationToggle
          label="Payout Received"
          description="Real-time notification for payouts"
          enabled={settings.pushPayout}
          onToggle={() => toggleSetting("pushPayout")}
        />
      </div>
    </div>
  );
}

function NotificationToggle({
  label,
  description,
  enabled,
  onToggle,
}: {
  label: string;
  description: string;
  enabled: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="flex items-center justify-between p-4 rounded-lg bg-white/[0.02] border border-white/5">
      <div>
        <p className="text-white font-medium">{label}</p>
        <p className="text-white/40 text-sm">{description}</p>
      </div>
      <button
        onClick={onToggle}
        className={`relative w-12 h-6 rounded-full transition-colors ${
          enabled ? "bg-cyan-400" : "bg-white/20"
        }`}
      >
        <div
          className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
            enabled ? "left-7" : "left-1"
          }`}
        />
      </button>
    </div>
  );
}

function SecuritySettings() {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-white">Security Settings</h3>

      <div className="space-y-4">
        <div className="p-4 rounded-lg bg-white/[0.02] border border-white/5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-medium">Two-Factor Authentication</p>
              <p className="text-white/40 text-sm">
                Add an extra layer of security to your account
              </p>
            </div>
            <button className="btn-secondary text-sm">Enable</button>
          </div>
        </div>

        <div className="p-4 rounded-lg bg-white/[0.02] border border-white/5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-medium">Active Sessions</p>
              <p className="text-white/40 text-sm">
                Manage your active login sessions
              </p>
            </div>
            <button className="btn-secondary text-sm">View</button>
          </div>
        </div>

        <div className="p-4 rounded-lg bg-white/[0.02] border border-white/5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-medium">Connected Wallets</p>
              <p className="text-white/40 text-sm">
                Manage wallets connected to your account
              </p>
            </div>
            <button className="btn-secondary text-sm">Manage</button>
          </div>
        </div>

        <div className="p-4 rounded-lg bg-red-400/10 border border-red-400/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-400 font-medium">Delete Account</p>
              <p className="text-red-400/60 text-sm">
                Permanently delete your account and all data
              </p>
            </div>
            <button className="px-4 py-2 rounded-lg bg-red-400/20 text-red-400 text-sm hover:bg-red-400/30 transition-colors">
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
