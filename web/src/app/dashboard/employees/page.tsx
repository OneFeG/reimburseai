"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Loader2,
  Search,
  Shield,
  UserCheck,
  UserMinus,
  UserPlus,
  Users,
} from "lucide-react";
import { useProfile } from "@/hooks";
import { companyApi, employeeApi, type Employee } from "@/lib/api";

export default function EmployeesPage() {
  const { employee, company, refreshProfile, isCompany } = useProfile();
  const role = employee?.employee_role || "employee";
  const isEmployeeScoped = !isCompany;
  const canInvite = isCompany || role === "manager" || role === "admin";
  const canManageEmployees =
    isCompany || role === "manager" || role === "admin";
  const authz = useMemo(
    () =>
      isCompany
        ? { accountType: "company" as const }
        : { accountType: "employee" as const, employeeRole: role },
    [isCompany, role],
  );
  const isInvited = employee?.employee_status === "invited";

  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting] = useState(false);
  const [accepting, setAccepting] = useState(false);

  const [lookupId, setLookupId] = useState("");
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupResult, setLookupResult] = useState<any>(null);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [employeesLoading, setEmployeesLoading] = useState(false);

  const [message, setMessage] = useState<{
    type: "ok" | "error";
    text: string;
  } | null>(null);

  const title = useMemo(() => {
    if (!employee) return "Employees";
    return role === "admin"
      ? "Employees (Admin)"
      : role === "manager"
        ? "Employees (Manager)"
        : "Employees";
  }, [employee, role]);

  const loadEmployees = useCallback(async () => {
    if (!canManageEmployees) return;
    setEmployeesLoading(true);
    setMessage(null);
    const response = await companyApi.getEmployeesInCompany(
      isEmployeeScoped,
      authz,
    );
    if (response.success && response.data) {
      setEmployees(response.data);
    } else {
      setEmployees([]);
      setMessage({
        type: "error",
        text: response.error?.message || "Failed to load employees",
      });
    }
    setEmployeesLoading(false);
  }, [authz, canManageEmployees, isEmployeeScoped]);

  useEffect(() => {
    loadEmployees();
  }, [loadEmployees]);

  const inviteEmployee = async () => {
    if (!inviteEmail) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inviteEmail)) {
      setMessage({ type: "error", text: "Invalid email format" });
      return;
    }
    setInviting(true);
    setMessage(null);
    const response = await companyApi.inviteEmployee(
      inviteEmail,
      isEmployeeScoped,
      authz,
    );
    if (response.success) {
      setInviteEmail("");
      setMessage({ type: "ok", text: "Invite sent" });
    } else {
      setMessage({
        type: "error",
        text: response.error?.message || "Invite failed",
      });
    }
    setInviting(false);
  };

  const acceptInvite = async () => {
    setAccepting(true);
    setMessage(null);
    const response = await employeeApi.acceptInvite();
    if (response.success) {
      await refreshProfile();
      setMessage({ type: "ok", text: "Invite accepted" });
    } else {
      setMessage({
        type: "error",
        text: response.error?.message || "Failed to accept invite",
      });
    }
    setAccepting(false);
  };

  const lookupEmployee = async () => {
    if (!lookupId) return;
    if (!canManageEmployees) {
      setMessage({ type: "error", text: "Not allowed" });
      return;
    }
    setLookupLoading(true);
    setMessage(null);
    const response = await employeeApi.getById(lookupId, authz);
    if (response.success && response.data) {
      setLookupResult(response.data);
    } else {
      setLookupResult(null);
      setMessage({
        type: "error",
        text: response.error?.message || "Employee not found",
      });
    }
    setLookupLoading(false);
  };

  const updateLookupEmployee = async (updates: Record<string, unknown>) => {
    if (!lookupResult?.id) return;
    if (!canManageEmployees) {
      setMessage({ type: "error", text: "Not allowed" });
      return;
    }
    setUpdateLoading(true);
    setMessage(null);
    const response = await employeeApi.update(
      lookupResult.id,
      updates as any,
      authz,
    );
    if (response.success && response.data) {
      setLookupResult(response.data);
      setMessage({ type: "ok", text: "Employee updated" });
    } else {
      setMessage({
        type: "error",
        text: response.error?.message || "Update failed",
      });
    }
    setUpdateLoading(false);
  };

  const deleteLookupEmployee = async () => {
    if (!lookupResult?.id) return;
    if (!canManageEmployees) {
      setMessage({ type: "error", text: "Not allowed" });
      return;
    }
    setDeleteLoading(true);
    setMessage(null);
    const response = await companyApi.deleteEmployee(
      lookupResult.id,
      isEmployeeScoped,
      authz,
    );
    if (response.success) {
      setLookupResult(null);
      setLookupId("");
      await loadEmployees();
      setMessage({ type: "ok", text: "Employee deleted" });
    } else {
      setMessage({
        type: "error",
        text: response.error?.message || "Delete failed",
      });
    }
    setDeleteLoading(false);
  };

  const deleteEmployee = async (employeeId: string) => {
    if (!canManageEmployees) return;
    setMessage(null);
    const response = await companyApi.deleteEmployee(
      employeeId,
      isEmployeeScoped,
      authz,
    );
    if (response.success) {
      await loadEmployees();
      setMessage({ type: "ok", text: "Employee deleted" });
    } else {
      setMessage({
        type: "error",
        text: response.error?.message || "Delete failed",
      });
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-white">{title}</h1>
        <p className="text-white/50 mt-1">
          {company
            ? `Company: ${company.name || company.id}`
            : "No company assigned"}
        </p>
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

      {canManageEmployees && (
        <div className="card space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-white/5 text-white/70 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <p className="text-white font-semibold">Employees</p>
              <p className="text-white/50 text-sm">
                Manage employees in your company.
              </p>
            </div>
            <button
              onClick={loadEmployees}
              disabled={employeesLoading}
              className="btn-secondary disabled:opacity-50"
            >
              {employeesLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Loading...
                </>
              ) : (
                "Refresh"
              )}
            </button>
          </div>

          <div className="divide-y divide-white/5 rounded-xl overflow-hidden border border-white/10">
            {employees.length === 0 ? (
              <div className="p-4 text-white/50 text-sm">
                No employees found.
              </div>
            ) : (
              employees.map((row) => (
                <div
                  key={row.id}
                  className="p-4 flex flex-col sm:flex-row sm:items-center gap-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-white font-medium truncate">
                      {row.name || row.id}
                    </p>
                    <p className="text-white/50 text-sm truncate">
                      {row.email}
                    </p>
                    <p className="text-white/40 text-xs truncate">
                      {row.employee_role || "employee"} •{" "}
                      {row.employee_status || "active"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setLookupId(row.id);
                        setLookupResult(row);
                      }}
                      className="btn-secondary"
                    >
                      Manage
                    </button>
                    <button
                      onClick={() => deleteEmployee(row.id)}
                      className="btn-secondary border-red-400/30 text-red-400 hover:bg-red-400/10"
                    >
                      <UserMinus className="w-4 h-4" />
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {isInvited && (
        <div className="card space-y-3 border-amber-400/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-400/10 text-amber-400 flex items-center justify-center">
              <UserCheck className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <p className="text-white font-semibold">Pending invitation</p>
              <p className="text-white/50 text-sm">
                Accept to join your company.
              </p>
            </div>
            <button
              onClick={acceptInvite}
              disabled={accepting}
              className="btn-primary disabled:opacity-50"
            >
              {accepting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Accepting...
                </>
              ) : (
                "Accept invite"
              )}
            </button>
          </div>
        </div>
      )}

      {canInvite && (
        <div className="card space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-cyan-400/10 text-cyan-400 flex items-center justify-center">
              <UserPlus className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <p className="text-white font-semibold">Invite employee</p>
              <p className="text-white/50 text-sm">
                Managers can invite by email.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <input
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="employee@company.com"
              disabled={inviting}
              className="flex-1 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-cyan-400/50 transition-colors"
            />
            <button
              onClick={inviteEmployee}
              disabled={inviting || !inviteEmail}
              className="btn-secondary disabled:opacity-50"
            >
              {inviting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Sending...
                </>
              ) : (
                "Invite"
              )}
            </button>
          </div>
        </div>
      )}

      {canManageEmployees && (
        <div className="card space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-400/10 text-purple-400 flex items-center justify-center">
              <Shield className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <p className="text-white font-semibold">Employee tools</p>
              <p className="text-white/50 text-sm">
                Lookup and update an employee by ID.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
              <input
                value={lookupId}
                onChange={(e) => setLookupId(e.target.value)}
                placeholder="Employee UID"
                className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-cyan-400/50 transition-colors"
              />
            </div>
            <button
              onClick={lookupEmployee}
              disabled={lookupLoading || !lookupId}
              className="btn-secondary disabled:opacity-50"
            >
              {lookupLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Searching...
                </>
              ) : (
                "Lookup"
              )}
            </button>
          </div>

          {lookupResult && (
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10 space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-white font-medium truncate">
                    {lookupResult.name}
                  </p>
                  <p className="text-white/50 text-sm truncate">
                    {lookupResult.email}
                  </p>
                  <p className="text-white/40 text-xs truncate">
                    ID: {lookupResult.id}
                  </p>
                  <p className="text-white/40 text-xs truncate">
                    Status: {lookupResult.employee_status || "active"}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-white/70 text-sm font-medium mb-2">
                    Role
                  </label>
                  <select
                    value={String(lookupResult.employee_role || "employee")}
                    onChange={(e) =>
                      setLookupResult((prev: any) => ({
                        ...prev,
                        employee_role: e.target.value,
                      }))
                    }
                    className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-cyan-400/50 transition-colors"
                  >
                    <option className="bg-[#111] text-white" value="employee">
                      employee
                    </option>
                    <option className="bg-[#111] text-white" value="manager">
                      manager
                    </option>
                    <option className="bg-[#111] text-white" value="admin">
                      admin
                    </option>
                  </select>
                </div>
                <div>
                  <label className="block text-white/70 text-sm font-medium mb-2">
                    Department
                  </label>
                  <input
                    value={String(lookupResult.department || "")}
                    onChange={(e) =>
                      setLookupResult((prev: any) => ({
                        ...prev,
                        department: e.target.value,
                      }))
                    }
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-cyan-400/50 transition-colors"
                    placeholder="e.g. Finance"
                  />
                </div>
                <div>
                  <label className="block text-white/70 text-sm font-medium mb-2">
                    Employee Number
                  </label>
                  <input
                    value={String(lookupResult.employee_number || "")}
                    onChange={(e) =>
                      setLookupResult((prev: any) => ({
                        ...prev,
                        employee_number: e.target.value,
                      }))
                    }
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-cyan-400/50 transition-colors"
                    placeholder="e.g. EMP-001"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={deleteLookupEmployee}
                  disabled={deleteLoading}
                  className="btn-secondary disabled:opacity-50 border-red-400/30 text-red-400 hover:bg-red-400/10"
                >
                  {deleteLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    "Delete"
                  )}
                </button>
                <button
                  onClick={() =>
                    updateLookupEmployee({
                      employee_role: lookupResult.employee_role,
                      department: lookupResult.department,
                      employee_number: lookupResult.employee_number,
                    })
                  }
                  disabled={updateLoading}
                  className="btn-primary disabled:opacity-50"
                >
                  {updateLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    "Update"
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
