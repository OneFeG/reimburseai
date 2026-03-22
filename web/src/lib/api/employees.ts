/**
 * Employee API
 * ============
 * API functions for employee management.
 */

import { api } from "./client";
import type { ApiResponse } from "./client";

export interface Employee {
  id: string;
  company_id: string | null;
  email: string;
  name: string;
  invitedby: string;
  department?: string;
  employee_number?: string;
  smart_wallet_address?: string | null;
  wallet_address?: string | null;
  identificationnumber?: number;
  employee_status?: "active" | "inactive" | "invited" | string;
  employee_role?: "admin" | "manager" | "employee" | string;
  created_at?: string;
  updated_at?: string;
}

export interface CreateEmployeeRequest {
  name: string;
  IdentificationNumber: number;
}

export interface EmployeeStats {
  employee_id: string;
  total_receipts: number;
  pending_receipts: number;
  total_reimbursed: number;
  month_spend: number;
  updated_at?: string;
}

export const employeeApi = {
  /**
   * Create current user employee profile
   */
  async create(data: CreateEmployeeRequest) {
    return api.post<Employee>("/employeeup", data);
  },

  /**
   * Get current user employee profile
   */
  async getMe() {
    return api.get<Employee>("/employee");
  },

  /**
   * Get employee by ID (permission-scoped in backend)
   */
  async getById(
    employeeId: string,
    authz?: { accountType: "company" | "employee"; employeeRole?: string },
  ): Promise<ApiResponse<Employee>> {
    if (authz && authz.accountType === "employee") {
      const role = authz.employeeRole || "employee";
      if (role !== "manager" && role !== "admin") {
        return {
          success: false,
          error: { code: "FORBIDDEN", message: "Not allowed" },
        };
      }
    }
    return api.get<Employee>(`/employee?id=${encodeURIComponent(employeeId)}`);
  },

  /**
   * Update employee (self or admin/manager within same company)
   */
  async update(
    employeeId: string,
    data: Partial<Employee>,
    authz?: { accountType: "company" | "employee"; employeeRole?: string },
  ): Promise<ApiResponse<Employee>> {
    if (authz && authz.accountType === "employee") {
      const role = authz.employeeRole || "employee";
      if (role !== "manager" && role !== "admin") {
        return {
          success: false,
          error: { code: "FORBIDDEN", message: "Not allowed" },
        };
      }
    }
    return api.put<Employee>(
      `/employee?id=${encodeURIComponent(employeeId)}`,
      data,
    );
  },

  /**
   * Delete employee (admin/manager within same company)
   */
  async delete() {
    return api.delete<{ message: string }>(
      `/employee`,
    );
  },

  /**
   * Accept invite to join a company
   */
  async acceptInvite() {
    return api.post<{ message: string }>("/employee/accept");
  },
};

export const employeeStatsApi = {
  async create(data: EmployeeStats) {
    return api.post<EmployeeStats>("/employee_stats", data);
  },

  async getByEmployeeId(employeeId: string) {
    return api.get<EmployeeStats>(
      `/employee_stats?employee_id=${encodeURIComponent(employeeId)}`,
    );
  },

  async update(employeeId: string, data: Partial<EmployeeStats>) {
    return api.put<EmployeeStats>(
      `/employee_stats?employee_id=${encodeURIComponent(employeeId)}`,
      data,
    );
  },

  async delete(employeeId: string) {
    return api.delete<{ message: string }>(
      `/employee_stats?employee_id=${encodeURIComponent(employeeId)}`,
    );
  },
};
