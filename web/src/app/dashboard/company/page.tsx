"use client";

import { useMemo, useState } from "react";
import { Building2, Loader2, Mail, Plus, Save, Users } from "lucide-react";
import { useProfile } from "@/hooks";
import { companyApi } from "@/lib/api";

export default function CompanyPage() {
  const { employee, company, refreshProfile, isCompany } = useProfile();
  const role = employee?.employee_role || "employee";
  const isEmployeeManager = role === "manager";
  const isEmployeeAdmin = role === "admin";
  const isEmployeeScoped = !isCompany;
  const canManageCompany = isCompany || isEmployeeManager;
  const canInviteEmployees = isCompany || isEmployeeManager || isEmployeeAdmin;
  const authz = isCompany
    ? { accountType: "company" as const }
    : { accountType: "employee" as const, employeeRole: role };

  const [name, setName] = useState(company?.name || "");
  const [email, setEmail] = useState(company?.email || "");
  const [saving, setSaving] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState<{
    type: "ok" | "error";
    text: string;
  } | null>(null);

  const companyId = company?.id || "";
  const header = useMemo(() => {
    if (!company) return "No company";
    return company.name || company.id;
  }, [company]);

  const saveCompany = async () => {
    if (!companyId) return;
    if (!canManageCompany) {
      setMessage({ type: "error", text: "Not allowed" });
      return;
    }
    setSaving(true);
    setMessage(null);
    try {
      const response = await companyApi.update(
        companyId,
        { name, email },
        isEmployeeScoped,
        authz,
      );
      if (!response.success) {
        throw new Error(response.error?.message || "Update failed");
      }
      await refreshProfile();
      setMessage({ type: "ok", text: "Company updated" });
    } catch (e: any) {
      setMessage({
        type: "error",
        text: e?.message || "Update failed",
      });
    }
    setSaving(false);
  };

  const inviteEmployee = async () => {
    if (!inviteEmail) return;
    if (!canInviteEmployees) {
      setMessage({ type: "error", text: "Not allowed" });
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inviteEmail)) {
      setMessage({ type: "error", text: "Invalid email format" });
      return;
    }
    setInviting(true);
    setMessage(null);
    try {
      const response = await companyApi.inviteEmployee(
        inviteEmail,
        isEmployeeScoped,
        authz,
      );
      if (!response.success) {
        throw new Error(response.error?.message || "Invite failed");
      }
      setInviteEmail("");
      setMessage({ type: "ok", text: "Invite sent" });
    } catch (e: any) {
      setMessage({
        type: "error",
        text: e?.message || "Invite failed",
      });
    }
    setInviting(false);
  };

  const deleteCompany = async () => {
    if (!companyId) return;
    if (!canManageCompany) {
      setMessage({ type: "error", text: "Not allowed" });
      return;
    }
    setDeleting(true);
    setMessage(null);
    try {
      const response = await companyApi.delete(
        companyId,
        isEmployeeScoped,
        authz,
      );
      if (!response.success) {
        throw new Error(response.error?.message || "Delete failed");
      }
      await refreshProfile();
      setMessage({ type: "ok", text: "Company deleted" });
    } catch (e: any) {
      setMessage({
        type: "error",
        text: e?.message || "Delete failed",
      });
    }
    setDeleting(false);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white">Company</h1>
          <p className="text-white/50 mt-1">{header}</p>
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

      {!company ? (
        <div className="card">
          <p className="text-white/60">
            You are not assigned to a company yet.
          </p>
        </div>
      ) : (
        <>
          <div className="card space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-400/10 text-purple-400 flex items-center justify-center">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <p className="text-white font-semibold">Company Profile</p>
                <p className="text-white/50 text-sm">
                  Manage your company information.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-white/70 text-sm font-medium mb-2">
                  Company name
                </label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={!canManageCompany}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-cyan-400/50 transition-colors disabled:opacity-50"
                />
              </div>
              <div>
                <label className="block text-white/70 text-sm font-medium mb-2">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                  <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={!canManageCompany}
                    className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-cyan-400/50 transition-colors disabled:opacity-50"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end">
              <button
                onClick={saveCompany}
                disabled={!canManageCompany || saving}
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

            {!canManageCompany && (
              <p className="text-white/40 text-sm">
                Only managers can update company details.
              </p>
            )}
          </div>

          <div className="card space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-cyan-400/10 text-cyan-400 flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <p className="text-white font-semibold">Invite Employees</p>
                <p className="text-white/50 text-sm">
                  Invite by email to join your company.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <input
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="employee@company.com"
                disabled={!canInviteEmployees || inviting}
                className="flex-1 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-cyan-400/50 transition-colors disabled:opacity-50"
              />
              <button
                onClick={inviteEmployee}
                disabled={!canInviteEmployees || inviting || !inviteEmail}
                className="btn-secondary disabled:opacity-50"
              >
                {inviting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    Invite
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="card space-y-4 border-red-400/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-red-400/10 text-red-400 flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <p className="text-white font-semibold">Delete Company</p>
                <p className="text-white/50 text-sm">
                  This action is restricted.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end">
              <button
                onClick={deleteCompany}
                disabled={!canManageCompany || deleting}
                className="btn-secondary disabled:opacity-50 border-red-400/30 text-red-400 hover:bg-red-400/10"
              >
                {deleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  "Delete"
                )}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
